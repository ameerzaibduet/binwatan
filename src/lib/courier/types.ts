export type CourierProvider = "postex" | "nextstep"

export const COURIER_PROVIDERS: { id: CourierProvider; label: string }[] = [
  { id: "postex", label: "PostEx" },
  { id: "nextstep", label: "NextStep" },
]
