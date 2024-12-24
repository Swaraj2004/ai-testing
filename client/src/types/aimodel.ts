export interface SupportedMethod {
  key: string;
  id: string;
  name: string;
}

export interface Model {
  key: string;
  id: string;
  name: string;
  supported_methods: SupportedMethod[];
}

export interface AIModel {
  key: string;
  id: string;
  name: string;
  models: Model[];
}
