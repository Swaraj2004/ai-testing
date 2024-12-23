export interface SupportedMethod {
  id: string;
  name: string;
}

export interface Model {
  id: string;
  name: string;
  supported_methods: SupportedMethod[];
}

export interface AIModel {
  id: string;
  name: string;
  models: Model[];
}
