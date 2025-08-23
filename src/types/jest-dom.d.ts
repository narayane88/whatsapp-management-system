import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveClass(className: string): R
      toHaveTextContent(text: string | RegExp): R
      toBeVisible(): R
      toBeEmptyDOMElement(): R
      toBeDisabled(): R
      toBeEnabled(): R
      toBeInvalid(): R
      toBeValid(): R
      toBeRequired(): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveStyle(css: string | object): R
      toHaveFocus(): R
      toHaveFormValues(expectedValues: Record<string, any>): R
      toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): R
      toBeChecked(): R
      toBePartiallyChecked(): R
      toHaveDescription(text?: string | RegExp): R
      toHaveAccessibleDescription(text?: string | RegExp): R
      toHaveAccessibleName(text?: string | RegExp): R
      toHaveValue(value: string | string[] | number): R
    }
  }
}