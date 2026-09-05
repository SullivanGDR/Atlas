/** Public metadata only: tools never expose their internal implementation here. */
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  href: `/tools/${string}`;
  status: "available" | "planned";
}
