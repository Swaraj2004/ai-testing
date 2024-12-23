export interface SupportedMethod {
  id: string;
  name: string;
}

export interface Model {
  id: string;
  name: string;
}

export interface AIModel {
  id: string;
  name: string;
  models: Model[];
  supported_methods: SupportedMethod[];
}
