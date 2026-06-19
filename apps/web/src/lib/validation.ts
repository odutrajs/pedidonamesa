import { parsePriceInput } from './utils';

export const formConfig = {
  mode: 'onChange' as const,
  reValidateMode: 'onChange' as const,
};

export const emailRules = {
  required: 'Informe o e-mail.',
  pattern: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Informe um e-mail válido.',
  },
};

export const passwordRules = {
  required: 'Informe a senha.',
  minLength: { value: 4, message: 'A senha deve ter pelo menos 4 caracteres.' },
};

export const categoryNameRules = {
  required: 'Informe o nome da categoria.',
  validate: (value: string) =>
    value.trim().length > 0 || 'Informe o nome da categoria.',
};

export const productNameRules = {
  required: 'Informe o nome do produto.',
  validate: (value: string) =>
    value.trim().length > 0 || 'Informe o nome do produto.',
};

export const priceRules = {
  required: 'Informe o preço.',
  validate: (value: string) => {
    const price = parsePriceInput(value);
    if (Number.isNaN(price)) return 'Informe um preço válido.';
    if (price < 0) return 'O preço não pode ser negativo.';
    return true;
  },
};

export const categoryIdRules = {
  required: 'Selecione uma categoria.',
};

export const tableNumberRules = {
  required: 'Informe o número da mesa.',
  validate: (value: string) => {
    const number = Number(value);
    if (!value || Number.isNaN(number)) return 'Informe um número válido.';
    if (!Number.isInteger(number) || number < 1) {
      return 'O número deve ser inteiro e maior que zero.';
    }
    return true;
  },
};
