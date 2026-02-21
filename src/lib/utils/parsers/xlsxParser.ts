type XlsxModule = {
  read: (data: ArrayBuffer, options: { type: "array" }) => {
    SheetNames: string[];
    Sheets: Record<string, unknown>;
  };
  utils: {
    sheet_to_json: <T>(sheet: unknown, options: { defval: string; raw: boolean }) => T[];
  };
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

async function loadXlsx() {
  try {
    const dynamicImport = new Function("modulePath", "return import(modulePath);") as (
      modulePath: string
    ) => Promise<unknown>;
    const module = (await dynamicImport("xlsx")) as { default?: XlsxModule } & XlsxModule;
    return (module.default ?? module) as XlsxModule;
  } catch {
    return null;
  }
}

export async function parseXLSX(file: File): Promise<Record<string, string>[]> {
  const XLSX = await loadXlsx();
  if (!XLSX) {
    throw new Error("Excel parsing is unavailable. Install the xlsx package or upload CSV.");
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
    defval: "",
    raw: false,
  });

  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [normalizeHeader(key), String(value ?? "")])
    )
  );
}
