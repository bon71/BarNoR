#!/usr/bin/env python3
"""
PNGファイルからアルファチャネルを削除するスクリプト
"""
import struct
import zlib
import sys

def remove_alpha_channel(input_path, output_path):
    """PNGファイルからアルファチャネルを削除"""
    with open(input_path, 'rb') as f:
        # PNGシグネチャを確認
        signature = f.read(8)
        if signature != b'\x89PNG\r\n\x1a\n':
            print("Error: Not a valid PNG file")
            return False

        # 出力ファイルを開く
        with open(output_path, 'wb') as out:
            # シグネチャを書き込む
            out.write(signature)

            while True:
                # チャンクの長さを読む
                length_bytes = f.read(4)
                if not length_bytes:
                    break

                length = struct.unpack('>I', length_bytes)[0]
                chunk_type = f.read(4)
                chunk_data = f.read(length)
                crc = f.read(4)

                # IHDRチャンクの場合、カラータイプを変更
                if chunk_type == b'IHDR':
                    # IHDR: width(4) height(4) bit_depth(1) color_type(1) compression(1) filter(1) interlace(1)
                    width, height, bit_depth, color_type, compression, filter_method, interlace = struct.unpack('>IIBBBBB', chunk_data)

                    # カラータイプ 6 (RGBA) を 2 (RGB) に変更
                    if color_type == 6:
                        color_type = 2
                        new_chunk_data = struct.pack('>IIBBBBB', width, height, bit_depth, color_type, compression, filter_method, interlace)
                        new_crc = struct.pack('>I', zlib.crc32(chunk_type + new_chunk_data))

                        out.write(length_bytes)
                        out.write(chunk_type)
                        out.write(new_chunk_data)
                        out.write(new_crc)
                        print(f"Changed color type from RGBA to RGB")
                        continue

                # その他のチャンクはそのまま書き込む
                out.write(length_bytes)
                out.write(chunk_type)
                out.write(chunk_data)
                out.write(crc)

    return True

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python3 remove_alpha.py <input.png> <output.png>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    if remove_alpha_channel(input_file, output_file):
        print(f"Successfully removed alpha channel: {output_file}")
    else:
        print("Failed to remove alpha channel")
        sys.exit(1)
