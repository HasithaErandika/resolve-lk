export type IssueCategory = 'Garbage' | 'Road' | 'Water' | 'Lighting'
export type IssueStatus = 'Pending' | 'In Progress' | 'Resolved'
export type IssuePriority = 'Low' | 'Medium' | 'Critical'

export interface CivicIssue {
  id: string
  category: IssueCategory
  ward: string
  landmark: string
  description: string
  photoUrl?: string | null
  status: IssueStatus
  aiPriority: IssuePriority
  aiDepartment: string
  aiReason: string
  createdAt: string
}

export const CATEGORIES: IssueCategory[] = ['Garbage', 'Road', 'Water', 'Lighting']
export const STATUSES: IssueStatus[] = ['Pending', 'In Progress', 'Resolved']
export const PRIORITIES: IssuePriority[] = ['Low', 'Medium', 'Critical']
