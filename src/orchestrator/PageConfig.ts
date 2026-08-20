export function getPageName(): string {
  return process.env.PAGE_NAME ?? 'Page';
}

export function getPageClassName(): string {
  return `${getPageName()}Page`;
}

export function getPageObjectFileName(): string {
  return `${getPageClassName()}.ts`;
}

export function getSpecFileName(): string {
  return `${getPageName().toLowerCase()}.spec.ts`;
}

export function getPageObjectFilePath(): string {
  return `generated/${getPageObjectFileName()}`;
}

export function getSpecFilePath(): string {
  return `generated/${getSpecFileName()}`;
}
