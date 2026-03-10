// Schémas Zod — module Scanner
// REQ-SCN-002, REQ-SCN-003

import { z } from "zod"

export const platformSchema = z.enum(["INSTAGRAM", "TIKTOK", "YOUTUBE"])

export const createScanSchema = z
  .object({
    platform: platformSchema,
    importMethod: z.enum([
      "MANUAL_URL",
      "MANUAL_TEXT",
      "MANUAL_SCREENSHOT",
      "OAUTH",
      "EXTENSION",
    ]),
    url: z.string().url("URL invalide").optional(),
    content: z
      .string()
      .min(10, "Le contenu doit faire au moins 10 caractères")
      .max(10_000)
      .optional(),
    publishedAt: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.importMethod === "MANUAL_URL") return !!data.url
      if (data.importMethod === "MANUAL_TEXT") return !!data.content
      return true
    },
    {
      message: "URL ou contenu requis selon la méthode d'import",
      path: ["url"],
    }
  )

export type CreateScanInput = z.infer<typeof createScanSchema>
