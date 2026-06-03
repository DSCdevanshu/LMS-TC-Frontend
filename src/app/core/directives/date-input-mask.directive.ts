import { Directive, ElementRef, HostListener, inject, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: 'input[matDatepicker]',
  standalone: true
})
export class DateInputMaskDirective implements OnInit {
  private readonly el = inject(ElementRef<HTMLInputElement>);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  private digits = ''; // raw digit buffer (max 8)

  ngOnInit(): void {
    this.el.nativeElement.placeholder = 'dd/MM/yyyy';
    this.el.nativeElement.maxLength = 10;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    const nav = ['Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (nav.includes(e.key) || e.ctrlKey || e.metaKey) return;

    e.preventDefault();

    if (e.key === 'Backspace') {
      this.handleBackspace();
      return;
    }

    if (e.key === 'Delete') {
      this.digits = '';
      this.render();
      this.syncFormValue();
      return;
    }

    if (!/^\d$/.test(e.key)) return;
    if (this.digits.length >= 8) return;

    this.addDigit(e.key);
  }

  @HostListener('paste', ['$event'])
  onPaste(e: ClipboardEvent): void {
    e.preventDefault();
    const pasted = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
    if (!pasted) return;

    this.digits = '';
    for (const ch of pasted) {
      if (this.digits.length >= 8) break;
      this.addDigit(ch);
    }
  }

  @HostListener('blur')
  onBlur(): void {
    // If incomplete date, clear everything
    if (this.digits.length > 0 && this.digits.length < 8) {
      this.digits = '';
      this.render();
      this.syncFormValue();
    }
  }

  // Prevent the native input event from interfering
  @HostListener('input', ['$event'])
  onInput(e: Event): void {
    e.stopPropagation();
    // Re-render from our buffer (handles mobile keyboards, autocomplete, etc.)
    const raw = this.el.nativeElement.value.replace(/\D/g, '');
    if (raw !== this.digits) {
      this.digits = '';
      for (const ch of raw) {
        if (this.digits.length >= 8) break;
        this.addDigit(ch, false);
      }
      this.render();
      this.syncFormValue();
    }
  }

  private addDigit(digit: string, doRender = true): void {
    const pos = this.digits.length;

    // ── Day: positions 0-1 ──
    if (pos === 0) {
      // First digit of day: 4-9 → auto-pad to 0X
      if (+digit >= 4) {
        this.digits += '0' + digit;
      } else {
        this.digits += digit;
      }
    } else if (pos === 1) {
      // Second digit of day
      const day = +(this.digits[0] + digit);
      if (day === 0) {
        // 00 not valid, make it 01
        this.digits = '01';
      } else if (day > 31) {
        // e.g. 39 → treat as 03, then 9 goes to month
        this.digits = '0' + this.digits[0];
        this.addDigit(digit, false);
        if (doRender) { this.render(); this.syncFormValue(); }
        return;
      } else {
        this.digits += digit;
      }
    }
    // ── Month: positions 2-3 ──
    else if (pos === 2) {
      // First digit of month: 2-9 → auto-pad to 0X
      if (+digit >= 2) {
        this.digits += '0' + digit;
        // Cross-validate day against month
        this.correctDayForMonth();
      } else {
        this.digits += digit;
      }
    } else if (pos === 3) {
      // Second digit of month
      const month = +(this.digits[2] + digit);
      if (month === 0) {
        this.digits = this.digits.substring(0, 2) + '01';
      } else if (month > 12) {
        // e.g. 19 → treat as 01, push 9 to year
        this.digits = this.digits.substring(0, 2) + '0' + this.digits[2];
        this.correctDayForMonth();
        this.addDigit(digit, false);
        if (doRender) { this.render(); this.syncFormValue(); }
        return;
      } else {
        this.digits += digit;
      }
      this.correctDayForMonth();
    }
    // ── Year: positions 4-7 ──
    else if (pos < 8) {
      this.digits += digit;
    }

    if (doRender) {
      this.render();
      this.syncFormValue();
    }
  }

  private handleBackspace(): void {
    if (this.digits.length > 0) {
      this.digits = this.digits.substring(0, this.digits.length - 1);
      this.render();
      this.syncFormValue();
    }
  }

  private correctDayForMonth(): void {
    if (this.digits.length < 4) return;

    const day = +this.digits.substring(0, 2);
    const month = +this.digits.substring(2, 4);
    const year = this.digits.length === 8 ? +this.digits.substring(4, 8) : 2000;

    const maxDay = this.daysInMonth(month, year);
    if (day > maxDay) {
      const corrected = maxDay.toString().padStart(2, '0');
      this.digits = corrected + this.digits.substring(2);
    }
  }

  private daysInMonth(month: number, year: number): number {
    if ([4, 6, 9, 11].includes(month)) return 30;
    if (month === 2) {
      return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28;
    }
    return 31;
  }

  private readonly template = 'dd/MM/yyyy';
  // Maps digit index (0-7) to position in the template string
  private readonly digitToPos = [0, 1, 3, 4, 6, 7, 8, 9];

  private render(): void {
    const input = this.el.nativeElement;

    if (this.digits.length === 0) {
      input.value = '';
      return;
    }

    // Build display: overlay typed digits onto the template
    const chars = this.template.split('');
    for (let i = 0; i < this.digits.length; i++) {
      chars[this.digitToPos[i]] = this.digits[i];
    }
    input.value = chars.join('');

    // Place cursor right after the last typed digit
    const cursorPos = this.digitToPos[this.digits.length - 1] + 1;
    // Skip over slash if cursor lands before one
    const adjustedPos = (cursorPos === 2 || cursorPos === 5) ? cursorPos + 1 : cursorPos;
    input.setSelectionRange(adjustedPos, adjustedPos);
  }

  private static readonly MIN_YEAR = 1900;
  private static readonly MAX_YEAR = 2999;

  private syncFormValue(): void {
    if (this.digits.length === 8) {
      const day = +this.digits.substring(0, 2);
      const month = +this.digits.substring(2, 4);
      let year = +this.digits.substring(4, 8);

      // Clamp year to min/max range
      if (year < DateInputMaskDirective.MIN_YEAR) {
        year = DateInputMaskDirective.MIN_YEAR;
        this.digits = this.digits.substring(0, 4) + year.toString();
        this.render();
      } else if (year > DateInputMaskDirective.MAX_YEAR) {
        year = DateInputMaskDirective.MAX_YEAR;
        this.digits = this.digits.substring(0, 4) + year.toString();
        this.render();
      }

      // Re-validate day for the final year (leap year check)
      this.correctDayForMonth();
      const correctedDay = +this.digits.substring(0, 2);

      const date = new Date(year, month - 1, correctedDay);
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === correctedDay) {
        this.ngControl?.control?.setValue(date, { emitEvent: true });
        return;
      }
    }
    // Not a complete valid date — set null without clearing the display
    if (this.digits.length === 0) {
      this.ngControl?.control?.setValue(null, { emitEvent: true });
    }
  }
}
