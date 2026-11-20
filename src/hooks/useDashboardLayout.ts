import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';

export function useDashboardLayout(userId: string | number, dashboardId: string, defaultOrder: string[], defaultVisibility: Record<string, boolean>) {
  const [order, setOrder] = useState<string[]>(defaultOrder);
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>(defaultVisibility);
  const [isAutoLayout, setIsAutoLayout] = useState(true);
  const [isRearranging, setIsRearranging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Load from LocalStorage initially for speed
  useEffect(() => {
    const savedOrder = localStorage.getItem(`${dashboardId}_order_${userId}`);
    const savedVisibility = localStorage.getItem(`${dashboardId}_visibility_${userId}`);
    const savedAuto = localStorage.getItem(`${dashboardId}_auto_${userId}`);

    if (savedOrder) setOrder(JSON.parse(savedOrder));
    if (savedVisibility) setVisibleWidgets(JSON.parse(savedVisibility));
    if (savedAuto) setIsAutoLayout(JSON.parse(savedAuto));
  }, [userId, dashboardId]);

  // 2. Sync with Firestore for cross-session/cross-device persistence
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    
    // We need to wait for auth to be ready
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Clean up previous snapshot listener if any
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!fbUser || !userId) {
        setIsLoading(false);
        return;
      }

      const fbUid = fbUser.uid;
      const docRef = doc(db, 'user_preferences', `${fbUid}_${dashboardId}`);
      
      // Retry logic for user document to ensure security rules have context
      let userDocExists = false;
      for (let i = 0; i < 5; i++) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUid));
          if (userDoc.exists()) {
            userDocExists = true;
            break;
          }
        } catch (e) {
          console.warn('Error checking user doc:', e);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!userDocExists) {
        console.warn('User document not found in Firestore after retries. Layout sync may fail.');
      }

      // Listen for remote changes
      console.log(`Setting up listener for user_preferences/${fbUid}_${dashboardId}...`);
      unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
        console.log(`User preferences snapshot received for ${fbUid}_${dashboardId}. Exists: ${docSnap.exists()}`);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (docSnap.metadata.hasPendingWrites) {
            console.log('Skipping local write update for user_preferences');
            return;
          }
          
          if (data.order) setOrder(data.order);
          if (data.visibleWidgets) setVisibleWidgets(data.visibleWidgets);
          if (data.isAutoLayout !== undefined) setIsAutoLayout(data.isAutoLayout);
        }
        setIsLoading(false);
      }, (error) => {
        console.error(`User preferences listener error for ${fbUid}_${dashboardId}:`, error);
        setIsLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [userId, dashboardId]);

  // 3. Save changes to both LocalStorage and Firestore
  useEffect(() => {
    if (isLoading) return;

    localStorage.setItem(`${dashboardId}_order_${userId}`, JSON.stringify(order));
    localStorage.setItem(`${dashboardId}_visibility_${userId}`, JSON.stringify(visibleWidgets));
    localStorage.setItem(`${dashboardId}_auto_${userId}`, JSON.stringify(isAutoLayout));

    if (auth.currentUser && userId) {
      const fbUid = auth.currentUser.uid;
      const docRef = doc(db, 'user_preferences', `${fbUid}_${dashboardId}`);
      // Only save if not currently loading from remote
      setDoc(docRef, {
        order,
        visibleWidgets,
        isAutoLayout
      }, { merge: true }).catch(console.error);
    }
  }, [order, visibleWidgets, isAutoLayout, userId, dashboardId, isLoading]);

  const optimizeLayout = (optimalOrder: string[]) => {
    if (!isAutoLayout) return;
    setOrder(prev => {
      const newOrder = [...prev].sort((a, b) => {
        const indexA = optimalOrder.indexOf(a);
        const indexB = optimalOrder.indexOf(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
      return JSON.stringify(newOrder) === JSON.stringify(prev) ? prev : newOrder;
    });
  };

  return {
    order,
    setOrder,
    visibleWidgets,
    setVisibleWidgets,
    isAutoLayout,
    setIsAutoLayout,
    isRearranging,
    setIsRearranging,
    optimizeLayout
  };
}
