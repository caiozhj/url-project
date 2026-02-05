export class ShortCodeGenerator {
  private static readonly BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly CODE_LENGTH = 6;

  static generate(sequence: number): string {
    if (sequence === 0) {
      return '0'.repeat(this.CODE_LENGTH);
    }

    let num = sequence;
    let result = '';

    while (num > 0) {
      result = this.BASE62_CHARS[num % 62] + result;
      num = Math.floor(num / 62);
    }

    return result.padStart(this.CODE_LENGTH, '0');
  }

  static decode(code: string): number {
    let num = 0;
    for (let i = 0; i < code.length; i++) {
      const charIndex = this.BASE62_CHARS.indexOf(code[i]);
      if (charIndex === -1) {
        throw new Error('Código inválido');
      }
      num = num * 62 + charIndex;
    }
    return num;
  }
}
