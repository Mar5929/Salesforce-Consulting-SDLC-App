/**
 * Centralized token field stripping for Project objects.
 * Prevents leaking Salesforce OAuth tokens to the client.
 */

type ProjectLike = Record<string, unknown>

const SENSITIVE_FIELDS = [
  "sfOrgAccessToken",
  "sfOrgRefreshToken",
  "sfOrgInstanceUrl",
  "keyVersion",
] as const

export function stripTokenFields<T extends ProjectLike>(project: T): Omit<T, typeof SENSITIVE_FIELDS[number]> {
  const result = { ...project }
  for (const field of SENSITIVE_FIELDS) {
    delete result[field]
  }
  return result as Omit<T, typeof SENSITIVE_FIELDS[number]>
}

export function stripTokenFieldsFromMany<T extends ProjectLike>(projects: T[]): Omit<T, typeof SENSITIVE_FIELDS[number]>[] {
  return projects.map(stripTokenFields)
}
