
export enum ProjectStatus {
  PLANNING = '規劃中',
  ONGOING = '執行中',
  REVIEWING = '考評中',
  COMPLETED = '已結案',
  STALLED = '進度落後'
}

export enum KRStatus {
  ON_TRACK = '符合進度',
  DELAYED = '進度落後',
  AHEAD = '進度超前',
  NOT_STARTED = '尚未開始'
}

export enum BudgetCategory {
  PERSONNEL = '人事費',
  OPERATING = '業務費',
  MISCELLANEOUS = '雜支'
}

export enum UserRole {
  ADMIN = 'MOC_ADMIN',
  OPERATOR = 'UNIT_OPERATOR'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  unitId?: string; 
}

export interface ContactInfo {
  name: string;
  title: string;
  phone?: string;
  mobile?: string;
  email: string;
}

export interface AssessmentResult {
  status: KRStatus;
  strategy: string;
}

export interface VisitRow {
  id: string;
  workItem: string;
  opinion: string;
  status: KRStatus;
  strategy: string;
}

export interface KRReport {
  krId: string;
  executionNote: string;
  progress: number;
  status: KRStatus;
  improvementStrategy: string;
}

export interface ExpenditureDetail {
  id: string;
  budgetItemId: string;
  amount: number;
  description: string;
  receiptUrls: string[];
}

export interface MonthlyReport {
  id?: string;
  projectId: string;
  month: string;
  krReports: KRReport[];
  expenditures: ExpenditureDetail[];
  fanpageLinks?: string[];
  summary: string;
  submittedAt?: string;
}

export interface CoachingRecord {
  id: string; 
  projectId: string;
  serialNumber: string; 
  location: string;
  frequency: string;
  method: '實地訪視' | '視訊' | '電話' | '其他';
  writer: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees: {
    commissioners: boolean;
    staff: boolean;
    representatives: boolean;
    liaison: boolean;
    others: string;
  };
  overallResults: {
    progress: AssessmentResult;
    content: AssessmentResult;
    records: AssessmentResult;
    vouchers: AssessmentResult;
  };
  visitContents: VisitRow[];
  communityMobilization: VisitRow;
  communityConnection: VisitRow;
  photos: string[];
  attachmentUrl?: string;
  operatorFeedback?: string; 
  keyPoints?: string;
}

export interface KeyResult {
  id: string;
  description: string;
  targetValue: number;
  expectedDate: string;
}

export interface Objective {
  id: string;
  title: string;
  weight: number; 
  keyResults: KeyResult[];
}

export interface BudgetItem {
  id: string;
  category: BudgetCategory;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  description: string;
}

export interface GrantStage {
  stage: string; 
  documents: GrantDocument[];
  submissionDate?: string; // 檢送日期
  deadline?: string;       // 截止日期
  paymentDate?: string; 
  mocFinalCheck: MOCCheckStatus; // 文化部獨立檢核點
  mocRemark?: string;            // 文化部審核意見
}

export interface GrantDocument {
  name: string;
  status: GrantDocStatus;
  fileUrl?: string; 
  remark?: string; 
}

export type GrantDocStatus = '—' | '已上傳' | '審核中' | '已退回' | '待補件' | '已完成';
export type MOCCheckStatus = '待檢核' | '符合' | '不符合' | '—';

export interface Project {
  id: string;
  unitId: string;
  unitName: string;
  name: string;
  executingUnit: string;
  year: string;
  period: string; 
  category: '原鄉文化行動' | '都市文化行動';
  representative: ContactInfo;
  liaison: ContactInfo;
  legalAddress: string;
  contactAddress: string;
  siteType: '原鄉' | '都市';
  sites: string[];
  appliedAmount: number;
  approvedAmount: number;
  commissioner: ContactInfo;
  chiefStaff: ContactInfo;
  vision: string; 
  objectives: Objective[]; 
  budgetItems: BudgetItem[];
  grants: GrantStage[];
  coachingRecords: CoachingRecord[];
  status: ProjectStatus;
  progress: number;
  village: string;
  startDate: string;
  endDate: string;
  description: string;
  spent: number;
  budget: number;
}

export interface Report {
  id: string;
  projectId: string;
  date: string;
  title: string;
  content: string;
  images: string[];
}
