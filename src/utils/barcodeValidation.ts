/**
 * バーコード検証ユーティリティ
 */

/**
 * バーコードがISBN-13形式かどうかを判定
 * ISBN-13は978または979で始まる13桁の数字
 */
export const isISBN13 = (barcode: string): boolean => {
  // ハイフンを除去して数字のみにする
  const cleaned = barcode.replace(/-/g, '');

  // 13桁の数字で、978または979で始まるか確認
  return /^\d{13}$/.test(cleaned) && (cleaned.startsWith('978') || cleaned.startsWith('979'));
};

/**
 * バーコードがISBN-10形式かどうかを判定
 * ISBN-10は10桁の数字（最後の桁はXの場合もある）
 */
export const isISBN10 = (barcode: string): boolean => {
  // ハイフンを除去
  const cleaned = barcode.replace(/-/g, '');

  // 10桁で、最後の桁が数字またはX
  return /^\d{9}[\dX]$/.test(cleaned);
};

/**
 * バーコードがISBN（13または10）形式かどうかを判定
 */
export const isISBN = (barcode: string): boolean => {
  return isISBN13(barcode) || isISBN10(barcode);
};

/**
 * スキャンしたバーコードのリストからISBNを優先的に抽出
 * ISBNが見つからない場合は最初のバーコードを返す
 */
export const selectBestBarcode = (barcodes: string[]): string | null => {
  if (barcodes.length === 0) {
    return null;
  }

  // ISBN-13を優先
  const isbn13 = barcodes.find(isISBN13);
  if (isbn13) {
    return isbn13;
  }

  // 次にISBN-10
  const isbn10 = barcodes.find(isISBN10);
  if (isbn10) {
    return isbn10;
  }

  // ISBNが見つからない場合は最初のバーコードを返す
  return barcodes[0];
};
