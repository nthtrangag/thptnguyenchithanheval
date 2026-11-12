import React, { createContext, useContext, useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, setDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import {
  User,
  Role,
  Department,
  EvaluationPeriod,
  CriteriaCategory,
  Criterion,
  Evaluation,
  EvaluationDetail,
  RankingLevel,
} from '../types';
import {
  INITIAL_ROLES,
  INITIAL_DEPARTMENTS,
  INITIAL_USERS,
  INITIAL_PERIODS,
  INITIAL_CATEGORIES,
  INITIAL_CRITERIA,
  INITIAL_EVALUATIONS,
  INITIAL_EVALUATION_DETAILS,
} from '../data/initialData';
import { calculateTotalScore, determineRanking, filterCriteriaForUser } from '../utils/evaluationRules';

interface EvaluationContextType {
  // Authentication & Current session
  isAuthenticated: boolean;
  justLoggedOut: boolean;
  clearJustLoggedOut: () => void;
  currentUser: User;
  currentRole: Role;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  setCurrentUser: (user: User) => void;
  switchUserById: (userId: string) => void;

  // Master Data
  roles: Role[];
  departments: Department[];
  users: User[];
  periods: EvaluationPeriod[];
  selectedPeriodId: string;
  setSelectedPeriodId: (id: string) => void;
  categories: CriteriaCategory[];
  criteria: Criterion[];
  evaluations: Evaluation[];
  evaluationDetails: EvaluationDetail[];

  // Helper getters
  getUserDepartment: (deptId: string) => Department | undefined;
  getUserById: (userId: string) => User | undefined;
  getEvaluationForUser: (userId: string, periodId?: string) => Evaluation | undefined;
  getEvaluationDetails: (evalId: string) => EvaluationDetail[];
  getUserCriteria: (user?: User) => { categories: CriteriaCategory[]; criteria: Criterion[] };
  
  // Step 1: Admin Operations
  addUser: (userData: Omit<User, 'id'>) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
  importUsersBatch: (
    newUsersList: Omit<User, 'id'>[],
    mode?: 'upsert' | 'replace'
  ) => Promise<{ added: number; updated: number }>;
  addPeriod: (periodData: Omit<EvaluationPeriod, 'id'>) => void;
  updatePeriod: (id: string, periodData: Partial<EvaluationPeriod>) => void;
  deletePeriod: (id: string) => void;
  addCategory: (categoryData: Omit<CriteriaCategory, 'id'>) => void;
  updateCategory: (id: string, categoryData: Partial<CriteriaCategory>) => void;
  deleteCategory: (id: string) => void;
  addCriterion: (criterionData: Omit<Criterion, 'id'>) => void;
  updateCriterion: (id: string, criterionData: Partial<Criterion>) => void;
  deleteCriterion: (id: string) => void;
  importCriteriaBatch: (
    newCategories: CriteriaCategory[],
    newCriteria: Criterion[],
    mode?: 'upsert' | 'replace'
  ) => { categoriesAdded: number; categoriesUpdated: number; criteriaAdded: number; criteriaUpdated: number };

  // Step 2: Teacher Self-Evaluation (DRAFT -> SUBMITTED)
  initEvaluationForTeacher: (userId: string, periodId: string) => Evaluation;
  saveTeacherEvaluationDraft: (
    evaluationId: string,
    detailsUpdates: { criterionId: string; selfScore: number; evidenceText?: string; teacherNote?: string }[],
    generalComment?: string
  ) => void;
  submitTeacherEvaluation: (
    evaluationId: string,
    detailsUpdates: { criterionId: string; selfScore: number; evidenceText?: string; teacherNote?: string }[],
    generalComment?: string
  ) => void;

  // Step 3: Group Head Review (SUBMITTED -> GROUP_REVIEWED)
  submitGroupReview: (
    evaluationId: string,
    detailsUpdates: { criterionId: string; groupScore: number; groupNote?: string }[],
    generalComment?: string
  ) => void;
  // Revert submission / Return dossier to teacher (SUBMITTED / GROUP_REVIEWED -> DRAFT)
  revertEvaluationSubmission: (evaluationId: string, reason?: string) => void;

  // BGH reset evaluation completely back to un-evaluated state
  resetEvaluationByBgh: (evaluationId: string, reason?: string) => void;

  // Step 4: BGH Final Approval (GROUP_REVIEWED -> APPROVED)
  submitBghApproval: (
    evaluationId: string,
    detailsUpdates: { criterionId: string; bghScore: number; bghNote?: string }[],
    ranking: RankingLevel,
    generalComment?: string
  ) => void;

  // Evidence file upload simulation
  addEvidenceFile: (
    detailId: string,
    file: { name: string; size: string; type: string }
  ) => void;
  removeEvidenceFile: (detailId: string, fileId: string) => void;

  // Reset demo data
  resetAllData: () => void;
}

const EvaluationContext = createContext<EvaluationContextType | null>(null);

const STORAGE_KEYS = {
  USERS: 'edueval_users_v233_yt_100',
  PERIODS: 'edueval_periods_v233_yt_100',
  CATEGORIES: 'edueval_categories_v233_yt_100',
  CRITERIA: 'edueval_criteria_v233_yt_100',
  EVALUATIONS: 'edueval_evaluations_v233_yt_100',
  DETAILS: 'edueval_details_v233_yt_100',
  CURRENT_USER_ID: 'edueval_current_user_id_v233_yt_100',
  SELECTED_PERIOD: 'edueval_selected_period_v233_yt_100',
};

export const EvaluationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const roles = INITIAL_ROLES;
  const departments = INITIAL_DEPARTMENTS;

  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  // Load and subscribe to users from Firestore in real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (querySnapshot) => {
      if (!querySnapshot.empty) {
        const firestoreUsers: User[] = [];
        querySnapshot.forEach(docSnap => {
          firestoreUsers.push(docSnap.data() as User);
        });
        if (firestoreUsers.length > 0) {
          setUsers(firestoreUsers);
        }
      } else {
        // If Firestore collection is empty, seed initial users
        INITIAL_USERS.forEach(async (u) => {
          await setDoc(doc(db, 'users', u.id), u);
        });
      }
    }, (err) => {
      console.error('Error listening to users from Firestore:', err);
    });

    return () => unsubscribe();
  }, []);

  const [periods, setPeriods] = useState<EvaluationPeriod[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PERIODS);
    return saved ? JSON.parse(saved) : INITIAL_PERIODS;
  });

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_PERIOD);
    return saved || 'period-2026-hk1';
  });

  const [categories, setCategories] = useState<CriteriaCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!saved) return INITIAL_CATEGORIES;
    try {
      const parsed = JSON.parse(saved);
      if (
        !Array.isArray(parsed) || 
        !parsed.some((c: CriteriaCategory) => c.id === 'cat-b1-yt') ||
        !parsed.some((c: CriteriaCategory) => c.id === 'cat-b1-tb') ||
        !parsed.some((c: CriteriaCategory) => c.id === 'cat-b4-vttp') ||
        !parsed.some((c: CriteriaCategory) => c.id === 'cat-b1-vt') ||
        !parsed.some((c: CriteriaCategory) => c.id === 'cat-b1-kt')
      ) {
        return INITIAL_CATEGORIES;
      }
      return parsed;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [criteria, setCriteria] = useState<Criterion[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CRITERIA);
    if (!saved) return INITIAL_CRITERIA;
    try {
      const parsed = JSON.parse(saved);
      if (
        !Array.isArray(parsed) || 
        !parsed.some((c: Criterion) => c.id === 'crit-yt-b1a') ||
        !parsed.some((c: Criterion) => c.id === 'crit-tb-b1a') ||
        !parsed.some((c: Criterion) => c.id === 'crit-vttp-b4a') || 
        !parsed.some((c: Criterion) => c.id === 'crit-vt-b1a') ||
        !parsed.some((c: Criterion) => c.id === 'crit-kt-b1a')
      ) {
        return INITIAL_CRITERIA;
      }
      return parsed;
    } catch {
      return INITIAL_CRITERIA;
    }
  });

  const [evaluations, setEvaluations] = useState<Evaluation[]>(INITIAL_EVALUATIONS);
  const [evaluationDetails, setEvaluationDetails] = useState<EvaluationDetail[]>(INITIAL_EVALUATION_DETAILS);

  // Load and subscribe to evaluations from Firestore in real-time
  useEffect(() => {
    const unsubEvals = onSnapshot(collection(db, 'evaluations'), (snapshot) => {
      if (!snapshot.empty) {
        const evals: Evaluation[] = [];
        snapshot.forEach(docSnap => evals.push(docSnap.data() as Evaluation));
        if (evals.length > 0) setEvaluations(evals);
      } else {
        INITIAL_EVALUATIONS.forEach(async (e) => {
          await setDoc(doc(db, 'evaluations', e.id), e);
        });
      }
    });

    const unsubDetails = onSnapshot(collection(db, 'evaluationDetails'), (snapshot) => {
      if (!snapshot.empty) {
        const details: EvaluationDetail[] = [];
        snapshot.forEach(docSnap => details.push(docSnap.data() as EvaluationDetail));
        if (details.length > 0) setEvaluationDetails(details);
      } else {
        INITIAL_EVALUATION_DETAILS.forEach(async (d) => {
          await setDoc(doc(db, 'evaluationDetails', d.id), d);
        });
      }
    });

    return () => {
      unsubEvals();
      unsubDetails();
    };
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('edueval_is_auth_v233_p4');
    return saved === 'true';
  });

  const [justLoggedOut, setJustLoggedOut] = useState<boolean>(false);

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return saved || 'u-gv-toan-1';
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PERIODS, JSON.stringify(periods));
  }, [periods]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_PERIOD, selectedPeriodId);
  }, [selectedPeriodId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CRITERIA, JSON.stringify(criteria));
  }, [criteria]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(evaluations));
  }, [evaluations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DETAILS, JSON.stringify(evaluationDetails));
  }, [evaluationDetails]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

  const currentUser = users.find(u => u.id === currentUserId) || users[0];
  const currentRole = roles.find(r => r.id === currentUser.roleId) || roles[3];

  const login = (usernameInput: string, passwordInput: string) => {
    const trimmed = usernameInput.trim().toLowerCase();
    let user = users.find(
      u =>
        u.username.toLowerCase() === trimmed ||
        (u.teacherCode && u.teacherCode.toLowerCase() === trimmed) ||
        u.email.toLowerCase() === trimmed
    );

    // Giải pháp 2: Auto-provisioning (Tự động tạo hồ sơ mặc định nếu email có trên Firebase Auth / hệ thống nhưng chưa có trong danh sách)
    if (!user && trimmed.includes('@')) {
      const newUser: User = {
        id: `u-auto-${Date.now()}`,
        username: trimmed.split('@')[0],
        password: passwordInput || '123456',
        fullName: trimmed.split('@')[0].toUpperCase(),
        email: trimmed,
        roleId: 'GIAO_VIEN',
        departmentId: 'dept-toan',
        isDepartmentHead: false,
        title: 'Giáo viên bộ môn',
        teacherCode: `GV-${Math.floor(100 + Math.random() * 900)}`,
        phone: '',
        subject: 'Đa môn',
      };
      setUsers(prev => [newUser, ...prev]);
      user = newUser;
    }

    if (!user) {
      return { success: false, error: 'Email, tên đăng nhập hoặc mã viên chức không tồn tại trên hệ thống!' };
    }

    const expected = user.password || '123456';
    if (passwordInput !== expected) {
      return { success: false, error: 'Mật khẩu không chính xác! Vui lòng kiểm tra lại.' };
    }

    setCurrentUserId(user.id);
    setIsAuthenticated(true);
    setJustLoggedOut(false);
    localStorage.setItem('edueval_is_auth_v233_p4', 'true');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setJustLoggedOut(true);
    localStorage.removeItem('edueval_is_auth_v233_p4');
  };

  const clearJustLoggedOut = () => {
    setJustLoggedOut(false);
  };

  const switchUserById = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUserId(user.id);
      setIsAuthenticated(true);
      setJustLoggedOut(false);
      localStorage.setItem('edueval_is_auth_v233_p4', 'true');
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    }
  };

  const getUserDepartment = (deptId: string) => {
    return departments.find(d => d.id === deptId);
  };

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const getEvaluationForUser = (userId: string, periodId = selectedPeriodId) => {
    return evaluations.find(e => e.userId === userId && e.periodId === periodId);
  };

  const getEvaluationDetails = (evalId: string) => {
    return evaluationDetails.filter(d => d.evaluationId === evalId);
  };

  const getUserCriteria = (user?: User) => {
    return filterCriteriaForUser(user || currentUser, categories, criteria);
  };

  // Step 1: Admin Operations
  const addUser = async (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `u-${Date.now()}`,
    };
    
    // Save to Firestore
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch (err) {
      console.error('Error saving user to Firestore:', err);
    }

    setUsers(prev => [newUser, ...prev]);

    // Automatically register on Firebase Authentication if email is valid
    if (userData.email && userData.email.includes('@')) {
      try {
        await createUserWithEmailAndPassword(auth, userData.email, userData.password || '123456');
      } catch (err: any) {
        console.log('Firebase Auth sync note:', err.message);
      }
    }
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    let updatedUser: User | undefined;
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        updatedUser = { ...u, ...userData };
        return updatedUser;
      }
      return u;
    }));

    if (updatedUser) {
      try {
        await setDoc(doc(db, 'users', id), updatedUser, { merge: true });
      } catch (err) {
        console.error('Error updating user in Firestore:', err);
      }
    }
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (err) {
      console.error('Error deleting user from Firestore:', err);
    }
  };

  const importUsersBatch = async (
    newUsersList: Omit<User, 'id'>[],
    mode: 'upsert' | 'replace' = 'upsert'
  ) => {
    let addedCount = 0;
    let updatedCount = 0;

    let finalUsers: User[] = [];

    setUsers(prevUsers => {
      if (mode === 'replace') {
        const adminUsers = prevUsers.filter(u => u.roleId === 'ADMIN');
        const formatted: User[] = newUsersList.map((u, idx) => ({
          ...u,
          id: `u-imp-${Date.now()}-${idx}`,
          password: u.password || '123456',
        }));
        const hasAdmin = formatted.some(u => u.roleId === 'ADMIN');
        addedCount = formatted.length;
        finalUsers = hasAdmin ? formatted : [...adminUsers, ...formatted];
        return finalUsers;
      }

      const cloned = [...prevUsers];
      newUsersList.forEach((incoming, idx) => {
        const existingIdx = cloned.findIndex(
          u =>
            (incoming.username && u.username.toLowerCase() === incoming.username.toLowerCase()) ||
            (incoming.teacherCode && u.teacherCode.toLowerCase() === incoming.teacherCode.toLowerCase()) ||
            (incoming.email && u.email.toLowerCase() === incoming.email.toLowerCase())
        );

        if (existingIdx >= 0) {
          cloned[existingIdx] = {
            ...cloned[existingIdx],
            ...incoming,
            password: incoming.password || cloned[existingIdx].password || '123456',
          };
          updatedCount++;
        } else {
          cloned.push({
            ...incoming,
            id: `u-imp-${Date.now()}-${idx}`,
            password: incoming.password || '123456',
          });
          addedCount++;
        }
      });
      finalUsers = cloned;
      return cloned;
    });

    // Save all to Firestore
    try {
      for (const u of finalUsers) {
        await setDoc(doc(db, 'users', u.id), u);
      }
    } catch (err) {
      console.error('Error saving batch users to Firestore:', err);
    }

    // Sync batch emails to Firebase Auth
    for (const u of newUsersList) {
      if (u.email && u.email.includes('@')) {
        try {
          await createUserWithEmailAndPassword(auth, u.email, u.password || '123456');
        } catch (err: any) {
          // Ignore if already registered
        }
      }
    }

    return { added: addedCount, updated: updatedCount };
  };

  const addPeriod = (periodData: Omit<EvaluationPeriod, 'id'>) => {
    const newPeriod: EvaluationPeriod = {
      ...periodData,
      id: `period-${Date.now()}`,
    };
    setPeriods(prev => [newPeriod, ...prev]);
    setSelectedPeriodId(newPeriod.id);
  };

  const updatePeriod = (id: string, periodData: Partial<EvaluationPeriod>) => {
    setPeriods(prev => prev.map(p => (p.id === id ? { ...p, ...periodData } : p)));
  };

  const deletePeriod = (id: string) => {
    setPeriods(prev => prev.filter(p => p.id !== id));
  };

  const addCategory = (categoryData: Omit<CriteriaCategory, 'id'>) => {
    const newCat: CriteriaCategory = {
      ...categoryData,
      id: `cat-${Date.now()}`,
    };
    setCategories(prev => [...prev, newCat]);
  };

  const updateCategory = (id: string, categoryData: Partial<CriteriaCategory>) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...categoryData } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addCriterion = (criterionData: Omit<Criterion, 'id'>) => {
    const newCrit: Criterion = {
      ...criterionData,
      id: `crit-${Date.now()}`,
    };
    setCriteria(prev => [...prev, newCrit]);
  };

  const updateCriterion = (id: string, criterionData: Partial<Criterion>) => {
    setCriteria(prev => prev.map(c => (c.id === id ? { ...c, ...criterionData } : c)));
  };

  const deleteCriterion = (id: string) => {
    setCriteria(prev => prev.filter(c => c.id !== id));
  };

  const importCriteriaBatch = (
    incomingCategories: CriteriaCategory[],
    incomingCriteria: Criterion[],
    mode: 'upsert' | 'replace' = 'upsert'
  ) => {
    let categoriesAdded = 0;
    let categoriesUpdated = 0;
    let criteriaAdded = 0;
    let criteriaUpdated = 0;

    let finalCategories: CriteriaCategory[] = [];
    let finalCriteria: Criterion[] = [];

    if (mode === 'replace') {
      finalCategories = incomingCategories;
      finalCriteria = incomingCriteria;
      categoriesAdded = incomingCategories.length;
      criteriaAdded = incomingCriteria.length;
    } else {
      // Upsert categories
      const catMap = new Map<string, CriteriaCategory>();
      categories.forEach(c => catMap.set(c.code.toLowerCase(), { ...c }));

      incomingCategories.forEach(incCat => {
        const key = incCat.code.toLowerCase();
        if (catMap.has(key)) {
          const old = catMap.get(key)!;
          catMap.set(key, {
            ...old,
            name: incCat.name,
            description: incCat.description || old.description,
            maxScore: incCat.maxScore || old.maxScore,
            order: incCat.order || old.order,
          });
          categoriesUpdated++;
        } else {
          catMap.set(key, incCat);
          categoriesAdded++;
        }
      });
      finalCategories = Array.from(catMap.values()).sort((a, b) => a.order - b.order);

      // Upsert criteria
      const critMap = new Map<string, Criterion>();
      criteria.forEach(c => critMap.set(c.code.toLowerCase(), { ...c }));

      incomingCriteria.forEach(incCrit => {
        const key = incCrit.code.toLowerCase();
        // find categoryId in finalCategories
        const matchingCat = finalCategories.find(fc => {
          const originalIncCat = incomingCategories.find(ic => ic.id === incCrit.categoryId);
          return originalIncCat && fc.code.toLowerCase() === originalIncCat.code.toLowerCase();
        });

        const targetCatId = matchingCat ? matchingCat.id : incCrit.categoryId;

        if (critMap.has(key)) {
          const old = critMap.get(key)!;
          critMap.set(key, {
            ...old,
            categoryId: targetCatId,
            name: incCrit.name,
            description: incCrit.description,
            maxScore: incCrit.maxScore,
            levels: incCrit.levels || old.levels,
          });
          criteriaUpdated++;
        } else {
          critMap.set(key, {
            ...incCrit,
            categoryId: targetCatId,
          });
          criteriaAdded++;
        }
      });
      finalCriteria = Array.from(critMap.values());
    }

    setCategories(finalCategories);
    setCriteria(finalCriteria);

    // Ensure evaluationDetails contains entries for any new criteria
    setEvaluationDetails(prevDetails => {
      const clonedDetails = [...prevDetails];
      evaluations.forEach(ev => {
        finalCriteria.forEach(crit => {
          const exists = clonedDetails.some(d => d.evaluationId === ev.id && d.criterionId === crit.id);
          if (!exists) {
            clonedDetails.push({
              id: `detail-${ev.id}-${crit.id}`,
              evaluationId: ev.id,
              criterionId: crit.id,
              selfScore: null,
              groupScore: null,
              bghScore: null,
              evidenceText: '',
              evidenceFiles: [],
            });
          }
        });
      });
      return clonedDetails;
    });

    return { categoriesAdded, categoriesUpdated, criteriaAdded, criteriaUpdated };
  };

  // Step 2: Initialize or fetch Teacher evaluation
  const initEvaluationForTeacher = (userId: string, periodId: string): Evaluation => {
    const existing = evaluations.find(e => e.userId === userId && e.periodId === periodId);
    if (existing) return existing;

    const teacher = users.find(u => u.id === userId);
    const targetTeacher = teacher || currentUser;
    const { criteria: applicableCriteria } = filterCriteriaForUser(targetTeacher, categories, criteria);
    const newEvalId = `eval-${Date.now()}`;
    const newEval: Evaluation = {
      id: newEvalId,
      periodId,
      userId,
      departmentId: targetTeacher?.departmentId || 'dept-toan-tin',
      status: 'DRAFT',
      selfTotalScore: 0,
      groupTotalScore: null,
      bghTotalScore: null,
      updatedAt: new Date().toISOString(),
    };

    // Create blank details for applicable criteria
    const newDetails: EvaluationDetail[] = applicableCriteria.map(crit => ({
      id: `detail-${newEvalId}-${crit.id}`,
      evaluationId: newEvalId,
      criterionId: crit.id,
      selfScore: null,
      groupScore: null,
      bghScore: null,
      evidenceText: '',
      evidenceFiles: [],
    }));

    setEvaluations(prev => [newEval, ...prev]);
    setEvaluationDetails(prev => [...prev, ...newDetails]);

    return newEval;
  };

  // Step 2: Teacher Save Draft
  const saveTeacherEvaluationDraft = async (
    evaluationId: string,
    detailsUpdates: { criterionId: string; selfScore: number; evidenceText?: string; teacherNote?: string }[],
    generalComment?: string
  ) => {
    let affectedDetails: EvaluationDetail[] = [];
    setEvaluationDetails(prev => {
      const updated = prev.map(d => {
        if (d.evaluationId !== evaluationId) return d;
        const match = detailsUpdates.find(u => u.criterionId === d.criterionId);
        if (match) {
          const updatedDetail = {
            ...d,
            selfScore: match.selfScore,
            evidenceText: match.evidenceText ?? d.evidenceText,
            teacherNote: match.teacherNote ?? d.teacherNote,
          };
          affectedDetails.push(updatedDetail);
          return updatedDetail;
        }
        return d;
      });
      return updated;
    });

    const currentDetails = evaluationDetails.map(d => {
      if (d.evaluationId !== evaluationId) return d;
      const match = detailsUpdates.find(u => u.criterionId === d.criterionId);
      if (match) {
        return { ...d, selfScore: match.selfScore };
      }
      return d;
    });

    const thisEvalDetails = currentDetails.filter(d => d.evaluationId === evaluationId);
    const targetEval = evaluations.find(e => e.id === evaluationId);
    const targetTeacher = targetEval ? users.find(u => u.id === targetEval.userId) : currentUser;
    const { criteria: applicableCriteria } = filterCriteriaForUser(targetTeacher, categories, criteria);

    const total = calculateTotalScore(thisEvalDetails, 'selfScore');
    const ranking = determineRanking(thisEvalDetails, applicableCriteria, 'selfScore');

    let updatedEval: Evaluation | undefined;
    setEvaluations(prev =>
      prev.map(e => {
        if (e.id !== evaluationId) return e;
        updatedEval = {
          ...e,
          status: 'DRAFT',
          selfTotalScore: total,
          selfRanking: ranking,
          generalTeacherComment: generalComment ?? e.generalTeacherComment,
          updatedAt: new Date().toISOString(),
        };
        return updatedEval;
      })
    );

    if (updatedEval) {
      await setDoc(doc(db, 'evaluations', evaluationId), updatedEval, { merge: true });
    }
    for (const d of affectedDetails) {
      await setDoc(doc(db, 'evaluationDetails', d.id), d, { merge: true });
    }
  };

  // Step 2: Teacher Submit (DRAFT -> SUBMITTED)
  const submitTeacherEvaluation = async (
    evaluationId: string,
    detailsUpdates: { criterionId: string; selfScore: number; evidenceText?: string; teacherNote?: string }[],
    generalComment?: string
  ) => {
    let affectedDetails: EvaluationDetail[] = [];
    let nextDetails: EvaluationDetail[] = [];
    setEvaluationDetails(prev => {
      nextDetails = prev.map(d => {
        if (d.evaluationId !== evaluationId) return d;
        const match = detailsUpdates.find(u => u.criterionId === d.criterionId);
        if (match) {
          const updated = {
            ...d,
            selfScore: match.selfScore,
            evidenceText: match.evidenceText ?? d.evidenceText,
            teacherNote: match.teacherNote ?? d.teacherNote,
          };
          affectedDetails.push(updated);
          return updated;
        }
        return d;
      });
      return nextDetails;
    });

    const targetDetails = nextDetails.length > 0 
      ? nextDetails.filter(d => d.evaluationId === evaluationId)
      : evaluationDetails.filter(d => d.evaluationId === evaluationId);

    const targetEval = evaluations.find(e => e.id === evaluationId);
    const targetTeacher = targetEval ? users.find(u => u.id === targetEval.userId) : currentUser;
    const { criteria: applicableCriteria } = filterCriteriaForUser(targetTeacher, categories, criteria);

    const total = calculateTotalScore(targetDetails, 'selfScore');
    const ranking = determineRanking(targetDetails, applicableCriteria, 'selfScore');

    let updatedEval: Evaluation | undefined;
    setEvaluations(prev =>
      prev.map(e => {
        if (e.id !== evaluationId) return e;
        updatedEval = {
          ...e,
          status: 'SUBMITTED',
          selfTotalScore: total,
          selfRanking: ranking,
          selfSubmittedAt: new Date().toISOString(),
          generalTeacherComment: generalComment ?? e.generalTeacherComment,
          updatedAt: new Date().toISOString(),
        };
        return updatedEval;
      })
    );

    if (updatedEval) {
      await setDoc(doc(db, 'evaluations', evaluationId), updatedEval, { merge: true });
    }
    for (const d of affectedDetails) {
      await setDoc(doc(db, 'evaluationDetails', d.id), d, { merge: true });
    }
  };

  // Step 3: Group Head Review (SUBMITTED -> GROUP_REVIEWED)
  const submitGroupReview = async (
    evaluationId: string,
    detailsUpdates: { criterionId: string; groupScore: number; groupNote?: string }[],
    generalComment?: string
  ) => {
    let affectedDetails: EvaluationDetail[] = [];
    let nextDetails: EvaluationDetail[] = [];
    setEvaluationDetails(prev => {
      nextDetails = prev.map(d => {
        if (d.evaluationId !== evaluationId) return d;
        const match = detailsUpdates.find(u => u.criterionId === d.criterionId);
        if (match) {
          const updated = {
            ...d,
            groupScore: match.groupScore,
            groupNote: match.groupNote ?? d.groupNote,
          };
          affectedDetails.push(updated);
          return updated;
        }
        return d;
      });
      return nextDetails;
    });

    const targetDetails = nextDetails.length > 0 
      ? nextDetails.filter(d => d.evaluationId === evaluationId)
      : evaluationDetails.filter(d => d.evaluationId === evaluationId);

    const targetEval = evaluations.find(e => e.id === evaluationId);
    const targetTeacher = targetEval ? users.find(u => u.id === targetEval.userId) : currentUser;
    const { criteria: applicableCriteria } = filterCriteriaForUser(targetTeacher, categories, criteria);

    const groupTotal = calculateTotalScore(targetDetails, 'groupScore');
    const groupRanking = determineRanking(targetDetails, applicableCriteria, 'groupScore');

    let updatedEval: Evaluation | undefined;
    setEvaluations(prev =>
      prev.map(e => {
        if (e.id !== evaluationId) return e;
        updatedEval = {
          ...e,
          status: 'GROUP_REVIEWED',
          groupTotalScore: groupTotal,
          groupRanking,
          groupReviewedAt: new Date().toISOString(),
          groupReviewerId: currentUser.id,
          generalGroupComment: generalComment ?? e.generalGroupComment,
          updatedAt: new Date().toISOString(),
        };
        return updatedEval;
      })
    );

    if (updatedEval) {
      await setDoc(doc(db, 'evaluations', evaluationId), updatedEval, { merge: true });
    }
    for (const d of affectedDetails) {
      await setDoc(doc(db, 'evaluationDetails', d.id), d, { merge: true });
    }
  };

  // Revert / Cancel submission: return to teacher as DRAFT (Xóa nộp hồ sơ để GV thực hiện lại)
  const revertEvaluationSubmission = async (evaluationId: string, reason?: string) => {
    const defaultReason = reason?.trim() || 'Tổ trưởng chuyên môn đã hoàn trả hồ sơ để giáo viên bổ sung minh chứng và rà soát lại kết quả.';

    let affectedDetails: EvaluationDetail[] = [];
    setEvaluationDetails(prev =>
      prev.map(d => {
        if (d.evaluationId !== evaluationId) return d;
        const updated = {
          ...d,
          groupScore: null,
          groupNote: d.groupNote ? `(Góp ý trước đó của tổ: ${d.groupNote})` : undefined,
        };
        affectedDetails.push(updated);
        return updated;
      })
    );

    let updatedEval: Evaluation | undefined;
    setEvaluations(prev =>
      prev.map(e => {
        if (e.id !== evaluationId) return e;
        updatedEval = {
          ...e,
          status: 'DRAFT',
          selfSubmittedAt: undefined,
          groupTotalScore: null,
          groupRanking: undefined,
          groupReviewedAt: undefined,
          groupReviewerId: undefined,
          generalGroupComment: undefined,
          returnReason: defaultReason,
          returnedAt: new Date().toISOString(),
          returnedBy: currentUser.fullName || currentUser.username,
          updatedAt: new Date().toISOString(),
        };
        return updatedEval;
      })
    );

    if (updatedEval) {
      await setDoc(doc(db, 'evaluations', evaluationId), updatedEval, { merge: true });
    }
    for (const d of affectedDetails) {
      await setDoc(doc(db, 'evaluationDetails', d.id), d, { merge: true });
    }
  };

  // BGH completely reset/delete evaluation scores and return back to un-evaluated state
  const resetEvaluationByBgh = async (evaluationId: string, reason?: string) => {
    const defaultReason = reason?.trim() || 'Ban Giám Hiệu đã phát hiện sai sót và quyết định hủy bỏ phiếu đánh giá để giáo viên thực hiện lập phiếu mới từ đầu.';

    let affectedDetails: EvaluationDetail[] = [];
    setEvaluationDetails(prev =>
      prev.map(d => {
        if (d.evaluationId !== evaluationId) return d;
        const resetDetail = {
          ...d,
          selfScore: null,
          groupScore: null,
          bghScore: null,
          evidenceText: '',
          teacherNote: undefined,
          groupNote: undefined,
          bghNote: undefined,
        };
        affectedDetails.push(resetDetail);
        return resetDetail;
      })
    );

    let updatedEval: Evaluation | undefined;
    setEvaluations(prev =>
      prev.map(e => {
        if (e.id !== evaluationId) return e;
        updatedEval = {
          ...e,
          status: 'DRAFT',
          selfTotalScore: 0,
          selfRanking: undefined,
          selfSubmittedAt: undefined,
          groupTotalScore: null,
          groupRanking: undefined,
          groupReviewedAt: undefined,
          groupReviewerId: undefined,
          generalGroupComment: undefined,
          bghTotalScore: null,
          bghRanking: undefined,
          bghApprovedAt: undefined,
          bghReviewerId: undefined,
          generalBghComment: undefined,
          returnReason: defaultReason,
          returnedAt: new Date().toISOString(),
          returnedBy: `BGH (${currentUser.fullName || currentUser.username})`,
          updatedAt: new Date().toISOString(),
        };
        return updatedEval;
      })
    );

    if (updatedEval) {
      await setDoc(doc(db, 'evaluations', evaluationId), updatedEval, { merge: true });
    }
    for (const d of affectedDetails) {
      await setDoc(doc(db, 'evaluationDetails', d.id), d, { merge: true });
    }
  };

  // Step 4: BGH Final Approval (GROUP_REVIEWED -> APPROVED)
  const submitBghApproval = (
    evaluationId: string,
    detailsUpdates: { criterionId: string; bghScore: number; bghNote?: string }[],
    ranking: RankingLevel,
    generalComment?: string
  ) => {
    let nextDetails: EvaluationDetail[] = [];
    setEvaluationDetails(prev => {
      nextDetails = prev.map(d => {
        if (d.evaluationId !== evaluationId) return d;
        const match = detailsUpdates.find(u => u.criterionId === d.criterionId);
        if (match) {
          return {
            ...d,
            bghScore: match.bghScore,
            bghNote: match.bghNote ?? d.bghNote,
          };
        }
        return d;
      });
      return nextDetails;
    });

    const targetDetails = nextDetails.length > 0 
      ? nextDetails.filter(d => d.evaluationId === evaluationId)
      : evaluationDetails.filter(d => d.evaluationId === evaluationId);

    const bghTotal = calculateTotalScore(targetDetails, 'bghScore');

    setEvaluations(prev =>
      prev.map(e => {
        if (e.id !== evaluationId) return e;
        return {
          ...e,
          status: 'APPROVED',
          bghTotalScore: bghTotal,
          bghRanking: ranking,
          bghApprovedAt: new Date().toISOString(),
          bghReviewerId: currentUser.id,
          generalBghComment: generalComment ?? e.generalBghComment,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Evidence file mock operations
  const addEvidenceFile = (
    detailId: string,
    file: { name: string; size: string; type: string }
  ) => {
    setEvaluationDetails(prev =>
      prev.map(d => {
        if (d.id !== detailId) return d;
        const newFile = {
          id: `file-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          url: '#',
        };
        return {
          ...d,
          evidenceFiles: [...(d.evidenceFiles || []), newFile],
        };
      })
    );
  };

  const removeEvidenceFile = (detailId: string, fileId: string) => {
    setEvaluationDetails(prev =>
      prev.map(d => {
        if (d.id !== detailId) return d;
        return {
          ...d,
          evidenceFiles: (d.evidenceFiles || []).filter(f => f.id !== fileId),
        };
      })
    );
  };

  const resetAllData = () => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setPeriods(INITIAL_PERIODS);
    setSelectedPeriodId('period-2026-hk1');
    setCategories(INITIAL_CATEGORIES);
    setCriteria(INITIAL_CRITERIA);
    setEvaluations(INITIAL_EVALUATIONS);
    setEvaluationDetails(INITIAL_EVALUATION_DETAILS);
    setCurrentUserId('u-gv-toan-1');
    setIsAuthenticated(false);
  };

  return (
    <EvaluationContext.Provider
      value={{
        isAuthenticated,
        justLoggedOut,
        clearJustLoggedOut,
        login,
        logout,
        currentUser,
        currentRole,
        setCurrentUser: (u) => setCurrentUserId(u.id),
        switchUserById,
        roles,
        departments,
        users,
        periods,
        selectedPeriodId,
        setSelectedPeriodId,
        categories,
        criteria,
        evaluations,
        evaluationDetails,
        getUserDepartment,
        getUserById,
        getEvaluationForUser,
        getEvaluationDetails,
        getUserCriteria,
        addUser,
        updateUser,
        deleteUser,
        importUsersBatch,
        addPeriod,
        updatePeriod,
        deletePeriod,
        addCategory,
        updateCategory,
        deleteCategory,
        addCriterion,
        updateCriterion,
        deleteCriterion,
        importCriteriaBatch,
        initEvaluationForTeacher,
        saveTeacherEvaluationDraft,
        submitTeacherEvaluation,
        submitGroupReview,
        revertEvaluationSubmission,
        resetEvaluationByBgh,
        submitBghApproval,
        addEvidenceFile,
        removeEvidenceFile,
        resetAllData,
      }}
    >
      {children}
    </EvaluationContext.Provider>
  );
};

export function useEvaluation() {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within an EvaluationProvider');
  }
  return context;
}
