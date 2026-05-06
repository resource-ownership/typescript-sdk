export type GenesisClientOptions = {
  baseUrl?: string;
  token?: string;
  tenantId?: string;
  clientId?: string;
  groupId?: string;
  userId?: string;
  agentId?: string;
};

export type WaitlistLeadInput = {
  opportunityId: string;
  email: string;
  company: string;
  role?: string;
  pain?: string;
  source?: string;
};

export type WaitlistLead = {
  id: string;
  opportunity_id: string;
  email: string;
  company: string;
  role: string;
  pain: string;
  source: string;
  budget_impact_usd: number;
  created_at: string;
};

export type BudgetApprovalInput = {
  budgetUsd: number;
  projectedRoiUsd: number;
  approvalThresholdUsd?: number;
};

export function requiresBudgetDecision(input: BudgetApprovalInput): boolean {
  const threshold = input.approvalThresholdUsd ?? 10;
  return input.budgetUsd > threshold;
}

export function hasPositiveROI(input: BudgetApprovalInput): boolean {
  return input.projectedRoiUsd > input.budgetUsd;
}

export function buildWaitlistPayload(input: WaitlistLeadInput) {
  return {
    opportunity_id: input.opportunityId,
    email: input.email.trim().toLowerCase(),
    company: input.company.trim(),
    role: input.role?.trim() ?? "",
    pain: input.pain?.trim() ?? "",
    source: input.source?.trim() ?? "horizon-genesis-web",
    budget_impact_usd: 0,
  };
}

export function createGenesisClient(options: GenesisClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? "http://localhost:8080").replace(/\/$/, "");

  function headers(extra?: HeadersInit): HeadersInit {
    const result: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Genesis-Tenant-ID": options.tenantId ?? "tenant_horizon_genesis",
      "X-Genesis-Client-ID": options.clientId ?? "client_internal_control_plane",
      "X-Genesis-Group-ID": options.groupId ?? "group_executive",
      "X-Genesis-User-ID": options.userId ?? "user_public_lead",
      "X-Genesis-Agent-ID": options.agentId ?? "public-web",
      ...Object.fromEntries(new Headers(extra).entries()),
    };
    if (options.token) {
      result.Authorization = `Bearer ${options.token}`;
    }
    return result;
  }

  async function postJSON<T>(path: string, payload: unknown): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(typeof body.error === "string" ? body.error : `Request failed with ${response.status}`);
    }
    return (await response.json()) as T;
  }

  return {
    createWaitlistLead(input: WaitlistLeadInput) {
      return postJSON<WaitlistLead>("/api/waitlist", buildWaitlistPayload(input));
    },
  };
}

