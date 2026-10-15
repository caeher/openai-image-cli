export interface StructuredPrompt {
  objective?: string;
  subject?: string;
  description?: string;
  environment?: string;
  composition?: string;
  cameraAngle?: string;
  framing?: string;
  perspective?: string;
  lighting?: string;
  palette?: string;
  materials?: string;
  textures?: string;
  style?: string;
  mood?: string;
  background?: string;
  detail?: string;
  textToRender?: string;
  references?: string;
  preserve?: string;
  modify?: string;
  avoid?: string;
  constraints?: string;
}

export interface PromptBuildInput {
  templateId?: string;
  styleId?: string;
  fields: StructuredPrompt;
  vars?: Record<string, string>;
}

export interface BuiltPrompt {
  text: string;
  sections: string[];
}

export interface PromptTemplate {
  id: string;
  defaultObjective: string;
}

export interface PromptValidation {
  ok: boolean;
  errors: string[];
  length: number;
}

export interface TextOptimizer {
  optimize(prompt: string, model: string, signal: AbortSignal): Promise<string>;
}
