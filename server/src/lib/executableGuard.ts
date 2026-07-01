import { Transform } from 'stream';

// Magic bytes that identify executable file types
// Checked against the FIRST chunk of every upload — client MIME/extension alone is not trusted
const BLOCKED_MAGIC: ReadonlyArray<readonly number[]> = [
  [0x4d, 0x5a],                   // MZ — PE executable / DLL / EXE (Windows)
  [0x7f, 0x45, 0x4c, 0x46],       // ELF — Linux / Android native binary
  [0xca, 0xfe, 0xba, 0xbe],       // Mach-O fat binary / Java .class
  [0xfe, 0xed, 0xfa, 0xce],       // Mach-O 32-bit LE
  [0xfe, 0xed, 0xfa, 0xcf],       // Mach-O 64-bit LE
  [0xce, 0xfa, 0xed, 0xfe],       // Mach-O 32-bit BE
  [0xcf, 0xfa, 0xed, 0xfe],       // Mach-O 64-bit BE
  [0x23, 0x21],                   // #! shebang (shell scripts)
];

// Filename extensions that are always rejected regardless of MIME
export const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.msi', '.bat', '.cmd', '.com', '.pif',
  '.scr', '.sh', '.bash', '.zsh', '.fish', '.csh',
  '.ps1', '.psm1', '.psd1', '.vbs', '.vbe', '.js',
  '.jse', '.wsf', '.wsh', '.reg', '.inf',
  '.apk', '.ipa', '.xapk',
  '.dmg', '.pkg', '.app',
  '.deb', '.rpm', '.run', '.bin',
  '.dll', '.so', '.dylib',
  '.class', '.jar',
  '.py', '.rb', '.pl', '.php',
]);

function startsWithMagic(buf: Buffer, magic: readonly number[]): boolean {
  if (buf.length < magic.length) return false;
  return magic.every((b, i) => buf[i] === b);
}

function isBlockedMagic(chunk: Buffer): boolean {
  return BLOCKED_MAGIC.some((magic) => startsWithMagic(chunk, magic));
}

/**
 * Creates a Transform stream that inspects the first chunk for executable magic bytes.
 * Destroys the stream with an error code if a blocked type is detected.
 * Transparently passes all bytes through otherwise.
 */
export function createExecutableGuard(): Transform {
  let checked = false;

  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      if (!checked) {
        checked = true;
        if (isBlockedMagic(chunk)) {
          callback(Object.assign(new Error('Executable file type rejected'), { code: 'BLOCKED_EXECUTABLE' }));
          return;
        }
      }
      callback(null, chunk);
    },
    flush(callback) {
      callback();
    },
  });
}

export function isBlockedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  const dot = lower.lastIndexOf('.');
  if (dot === -1) return false;
  return BLOCKED_EXTENSIONS.has(lower.slice(dot));
}
