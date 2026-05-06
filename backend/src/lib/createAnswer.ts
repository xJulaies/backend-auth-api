import { TStatusCode } from "./types/errorTypes";

export const createAnswer = (
  status: TStatusCode,
  message: string,
  data: any[],
) => {
  return { status, message, data };
};
