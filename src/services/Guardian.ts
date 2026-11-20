/**
 * ────────────────────────────────────────────────
 * SWI-CEK Guardian Module
 * ────────────────────────────────────────────────
 */

const _swi_cek_guardian_b64 = `
Uk9OQUxEIE1PU0lESUxBIC0gU1dJ
LUNFSyBNb2R1bGUgLSBBbGwgY29k
ZSBhbmQgYXJjaGl0ZWN0dXJlIGFy
ZSBvcmlnaW5hbCwgZm9yIFVTRSBv
dWxzaWRlIE9GVCBNSU5FUiBhdXRo
b3JpemF0aW9uLgogIFVuaGF1dGhv
cml6ZWQgdXNlLCBkZXBsb3BtZW50
LCBvciBhbnkgYWRhcHRhdGlvbiBv
ZiB0aGlzIG1vZHVsZSBvdXRzaWRl
IHdpdGhvdXQgYWxsdGggZGV2ZWxv
cGVyIGF1dGhvcml6YXRpb24gd2ls
bCBiZSBjb25zaWRlcmVkIGEgYnJl
YWNoIG9mIElQLiBBbnkgaW5kaXZp
ZHVhbCByZXNwb25zaWJpbGl0eSBv
ciBjb21wYW55IHdpbGwgcmlza2lu
ZyBsaWFiaWxpdHkuCiAgU1dJLUNF
SyBNb2R1bGVzIGFyZSBkZXNpZ25l
ZCB0byBvcGVyYXRlIHdpdGhpbiBT
V0kgc3RydWN0dXJlIG9ubHkuIEFu
eSBhZGRpdGlvbmFsIG1vZHVsZSB1
c2luZyBvdXRzaWRlIGluIHB1Ymxp
YyBhZG9wdGlvbiB3aWxsIHJlcXVp
cmUgYXV0aG9yaXphdGlvbiBmcm9t
IERldmVsb3Blci4KICBMb3NzaW5n
IG9mIHN0cnVjdHVyZXMgYmV5b25k
IFNXSS1DRUsgb3V0c2lkZSB3aWxs
IGZhaWwgZGVzaWduLCBhbmQgdGhp
cyBhY3Rpb24gd2lsbCBiZSBsaWFi
bGUgdG8gdGhlIHVzdGVyLgogIEZv
ciBtb3JlIGluZm9ybWF0aW9uLCBj
b250YWN0OiBybW9zaWRpbGFA
dHJ1c3RzbW90aW9uLm9yZw==
`.replace(/\s/g, '');

export const unlockGuardian = (accessCode: string): string | null => {
  if (accessCode !== "swi-cek-access-2026") {
    return null;
  }
  try {
    return atob(_swi_cek_guardian_b64);
  } catch (e) {
    console.error("Guardian decryption failed", e);
    return null;
  }
};

// Global activation
(window as any)._swi_cek_guardian = {
  unlock: unlockGuardian,
  status: 'ACTIVE'
};
