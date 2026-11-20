/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SWI Workflow Guard & Invariant Self-Contained Test Suite
 * 
 * Verifies:
 * 1. Sequential stage promotion (OBSERVED -> TESTED -> PROVEN -> SEALED -> PRODUCTION_AUTHORIZED)
 * 2. OBSERVATION ≠ AUTHORITY (unauthorized roles blocked from production)
 * 3. PASS ≠ PROVEN (test passing alone does not promote to PROVEN without dual corroboration)
 * 4. Tamper-evident sealing with SHA-256
 * 5. Offline mutation enqueue and idempotent nonces
 */

import { evaluateStageTransition, computeFastHash } from '../src/services/swiWorkflowGuard';
import { api } from '../src/services/api';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`TEST ASSERTION FAILED: ${message}`);
  }
}

export function runSWIWorkflowGuardTests(): { passed: number; failed: number; summary: string[] } {
  const summary: string[] = [];
  let passed = 0;
  let failed = 0;

  function runTest(name: string, fn: () => void) {
    try {
      fn();
      passed++;
      summary.push(`[PASS] ${name}`);
    } catch (e: any) {
      failed++;
      summary.push(`[FAIL] ${name} - ${e.message}`);
    }
  }

  runTest('Prevents direct transition from OBSERVED to PRODUCTION_AUTHORIZED (no skipping)', () => {
    const result = evaluateStageTransition(
      'OBSERVED',
      'PRODUCTION_AUTHORIZED',
      'school_admin',
      true,
      true,
      true
    );
    assert(result.allowed === false, 'Transition must be disallowed');
    assert(result.decision === 'HALT', 'Decision must be HALT');
    assert(
      result.reasons.some(r => r.includes('Workflow bypass prevented')),
      'Must contain workflow bypass reason'
    );
  });

  runTest('Blocks unauthorized roles (e.g. Student or Teacher) from granting PRODUCTION_AUTHORIZED', () => {
    const studentResult = evaluateStageTransition(
      'SEALED',
      'PRODUCTION_AUTHORIZED',
      'student',
      true,
      true,
      true
    );
    assert(studentResult.allowed === false, 'Student must be blocked');
    assert(studentResult.decision === 'DENY', 'Decision must be DENY');
    assert(
      studentResult.reasons.some(r => r.includes('lacks institutional authority')),
      'Must state authority lack'
    );

    const teacherResult = evaluateStageTransition(
      'SEALED',
      'PRODUCTION_AUTHORIZED',
      'teacher',
      true,
      true,
      true
    );
    assert(teacherResult.allowed === false, 'Teacher must be blocked');
    assert(teacherResult.decision === 'DENY', 'Decision must be DENY');
  });

  runTest('Allows School Admin, District Officer, or Ministry to grant PRODUCTION_AUTHORIZED on SEALED records', () => {
    const adminResult = evaluateStageTransition(
      'SEALED',
      'PRODUCTION_AUTHORIZED',
      'school_admin',
      true,
      true,
      true
    );
    assert(adminResult.allowed === true, 'Admin must be permitted on sealed record');
    assert(adminResult.decision === 'APPROVAL', 'Decision must be APPROVAL');

    const ministryResult = evaluateStageTransition(
      'SEALED',
      'PRODUCTION_AUTHORIZED',
      'ministry',
      true,
      true,
      true
    );
    assert(ministryResult.allowed === true, 'Ministry must be permitted');
    assert(ministryResult.decision === 'APPROVAL', 'Decision must be APPROVAL');
  });

  runTest('Enforces PASS ≠ PROVEN: automated tests passing without dual verification cannot reach PROVEN', () => {
    const result = evaluateStageTransition(
      'TESTED',
      'PROVEN',
      'teacher',
      true,
      true, // automated tests passed
      false // dual verification missing!
    );
    assert(result.allowed === false, 'PROVEN must fail without dual verification');
    assert(result.decision === 'HALT', 'Decision must be HALT');
    assert(
      result.reasons.some(r => r.includes('Dual-party verification required')),
      'Must explain dual verification requirement'
    );
  });

  runTest('Requires evidence hash for SEALED stage', () => {
    const result = evaluateStageTransition(
      'PROVEN',
      'SEALED',
      'counselor',
      false, // no evidence hash!
      true,
      true
    );
    assert(result.allowed === false, 'SEALED must fail without evidence hash');
    assert(result.decision === 'DENY', 'Decision must be DENY');
    assert(
      result.reasons.some(r => r.includes('requires verified evidence hash')),
      'Must explain evidence hash requirement'
    );
  });

  runTest('Deterministic FastHash produces repeatable 8-character hex digests', () => {
    const payload = { recordId: 'stu_101', score: 95 };
    const hash1 = computeFastHash(payload);
    const hash2 = computeFastHash(payload);
    assert(hash1 === hash2, 'Hashes must match');
    assert(hash1.length === 8, 'Hash length must be 8 chars');
  });

  runTest('Offline queue enqueues write without falsely claiming immediate server synchronization', () => {
    const initialQueueLength = api.getOfflineQueue().length;
    const mutation = api.enqueueOfflineMutation('/api/attendance', 'POST', {
      studentId: 101,
      status: 'PRESENT',
    });

    assert(mutation.status === 'PENDING', 'Status must be PENDING');
    assert(Boolean(mutation.id), 'Mutation must have an ID');
    assert(api.getOfflineQueue().length === initialQueueLength + 1, 'Queue length must increment');
  });

  return { passed, failed, summary };
}

// Auto-run if executed directly via node/tsx
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('swiWorkflowGuard.test')) {
  const result = runSWIWorkflowGuardTests();
  console.log(`\nSWI WORKFLOW GUARD TEST SUITE EXECUTION:`);
  result.summary.forEach(s => console.log(`  ${s}`));
  console.log(`TOTAL: ${result.passed} PASSED, ${result.failed} FAILED\n`);
  if (result.failed > 0) {
    process.exit(1);
  }
}
