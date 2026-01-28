import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  writeBatch, getDocs, query, orderBy, deleteDoc 
} from "firebase/firestore";
import { AppState, DailyBusinessResult, StaffShift, Material, DailyInventorySession, ExpenseRecord, MenuItemSales } from "../types";

// --- CẤU HÌNH FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBE5szn9psSgyAXneumN-oZCn7ydUR7gDU",
  authDomain: "cafemanager-ai.firebaseapp.com",
  projectId: "cafemanager-ai",
  storageBucket: "cafemanager-ai.firebasestorage.app",
  messagingSenderId: "1049851350405",
  appId: "1:1049851350405:web:6b1d82cb094fd6457548ec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection Names
const COLL_BUSINESS = "business_results";
const COLL_STAFF = "staff_payroll";
const COLL_MATERIALS = "materials";
const COLL_INVENTORY = "inventory_sessions";
const COLL_EXPENSES = "expenses"; 
const COLL_SALES = "sales_details"; // New collection

// --- SERVICES ---

/**
 * Lắng nghe toàn bộ dữ liệu từ Firebase (Real-time)
 */
export const subscribeToData = (
  onDataChange: (data: Partial<AppState>) => void,
  onError?: (error: any) => void
) => {
  const handleSnapshotError = (error: any) => {
    console.error("Firebase Snapshot Error:", error);
    if (onError) onError(error);
  };

  // 1. Listen to Business Results
  const unsubBusiness = onSnapshot(
    query(collection(db, COLL_BUSINESS)), 
    (snapshot) => {
      const results: DailyBusinessResult[] = [];
      snapshot.forEach((doc) => results.push(doc.data() as DailyBusinessResult));
      results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      onDataChange({ businessResults: results });
    },
    handleSnapshotError
  );

  // 2. Listen to Staff Payroll
  const unsubStaff = onSnapshot(
    collection(db, COLL_STAFF), 
    (snapshot) => {
      const staff: StaffShift[] = [];
      snapshot.forEach((doc) => staff.push(doc.data() as StaffShift));
      onDataChange({ staffPayroll: staff });
    },
    handleSnapshotError
  );

  // 3. Listen to Materials
  const unsubMaterials = onSnapshot(
    query(collection(db, COLL_MATERIALS), orderBy('id')), 
    (snapshot) => {
      const materials: Material[] = [];
      snapshot.forEach((doc) => materials.push(doc.data() as Material));
      onDataChange({ materials: materials });
    },
    handleSnapshotError
  );

  // 4. Listen to Inventory Sessions
  const unsubInventory = onSnapshot(
    collection(db, COLL_INVENTORY), 
    (snapshot) => {
      const sessions: DailyInventorySession[] = [];
      snapshot.forEach((doc) => sessions.push(doc.data() as DailyInventorySession));
      onDataChange({ inventorySessions: sessions });
    },
    handleSnapshotError
  );

  // 5. Listen to Expenses
  const unsubExpenses = onSnapshot(
    collection(db, COLL_EXPENSES),
    (snapshot) => {
      const expenses: ExpenseRecord[] = [];
      snapshot.forEach((doc) => expenses.push(doc.data() as ExpenseRecord));
      // Sort by date desc
      expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onDataChange({ expenses: expenses });
    },
    handleSnapshotError
  );

  // 6. Listen to Sales Details (Menu Mix)
  const unsubSales = onSnapshot(
    collection(db, COLL_SALES),
    (snapshot) => {
      const sales: MenuItemSales[] = [];
      snapshot.forEach((doc) => sales.push(doc.data() as MenuItemSales));
      onDataChange({ salesDetails: sales });
    },
    handleSnapshotError
  );

  return () => {
    unsubBusiness();
    unsubStaff();
    unsubMaterials();
    unsubInventory();
    unsubExpenses();
    unsubSales();
  };
};

/**
 * Kiểm tra xem Database có trống không. Nếu trống thì nạp dữ liệu mẫu ban đầu.
 */
export const seedInitialDataIfEmpty = async (initialData: AppState) => {
  try {
    const materialsSnap = await getDocs(collection(db, COLL_MATERIALS));
    
    if (materialsSnap.empty) {
      console.log("Database trống. Đang nạp dữ liệu mẫu...");
      const batch = writeBatch(db);

      initialData.materials.forEach(m => {
        const ref = doc(db, COLL_MATERIALS, m.id.toString());
        batch.set(ref, m);
      });

      initialData.staffPayroll.forEach(s => {
        const ref = doc(db, COLL_STAFF, s.name); 
        batch.set(ref, s);
      });

      initialData.businessResults.forEach(b => {
        const ref = doc(db, COLL_BUSINESS, b.date);
        batch.set(ref, b);
      });

      initialData.inventorySessions.forEach(i => {
        const ref = doc(db, COLL_INVENTORY, i.date);
        batch.set(ref, i);
      });
      
      // Seed Expenses is empty initially, no action needed

      await batch.commit();
      console.log("Đã nạp dữ liệu mẫu thành công!");
    }
  } catch (error) {
    console.error("Lỗi khi seed data (thường do quyền truy cập):", error);
    throw error;
  }
};

// --- UPDATE FUNCTIONS ---

export const saveBusinessResultToFireStore = async (result: DailyBusinessResult) => {
  await setDoc(doc(db, COLL_BUSINESS, result.date), result);
};

export const saveStaffToFireStore = async (staff: StaffShift) => {
  await setDoc(doc(db, COLL_STAFF, staff.name), staff);
};

export const saveAllStaffToFirestore = async (staffList: StaffShift[]) => {
  const batch = writeBatch(db);
  staffList.forEach(s => {
    const ref = doc(db, COLL_STAFF, s.name);
    batch.set(ref, s);
  });
  await batch.commit();
};

export const saveMaterialsBatchToFirestore = async (materials: Material[]) => {
  const batch = writeBatch(db);
  materials.forEach(m => {
    const ref = doc(db, COLL_MATERIALS, m.id.toString());
    batch.set(ref, m);
  });
  await batch.commit();
}

export const saveInventorySessionToFirestore = async (session: DailyInventorySession) => {
  await setDoc(doc(db, COLL_INVENTORY, session.date), session);
};

// --- EXPENSE FUNCTIONS ---

export const saveExpenseToFirestore = async (expense: ExpenseRecord) => {
  await setDoc(doc(db, COLL_EXPENSES, expense.id), expense);
};

export const deleteExpenseFromFirestore = async (expenseId: string) => {
  await deleteDoc(doc(db, COLL_EXPENSES, expenseId));
};

// --- SALES DETAILS FUNCTIONS ---

export const saveSalesBatchToFirestore = async (salesItems: MenuItemSales[]) => {
  const batch = writeBatch(db);
  salesItems.forEach(item => {
    const ref = doc(db, COLL_SALES, item.id);
    batch.set(ref, item);
  });
  await batch.commit();
};
