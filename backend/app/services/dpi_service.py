"""
DPI & Print Resolution Service for POD Design Studio.
Provides high-accuracy DPI inspection, physical print dimension calculation (Inches/CM),
print quality grading, and high-definition 300 DPI upscaling with edge sharpening
and transparent PNG pHYs metadata injection.
"""
import os
import io
import uuid
import math
from typing import Dict, Any, Optional, Tuple
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageOps

from app.config import (
    ARTWORKS_DIR,
    DTG_TARGET_WIDTH,
    DTG_TARGET_HEIGHT,
    DTG_TARGET_DPI
)
from app.services.background_removal import extract_transparent_artwork

def inspect_image_dpi(
    img: Image.Image,
    file_size_bytes: Optional[int] = None,
    filename: Optional[str] = None
) -> Dict[str, Any]:
    """
    Inspects image resolution, DPI metadata (EXIF/pHYs chunk),
    calculates physical print size at current DPI and at 300 DPI DTG standard,
    and returns a comprehensive print readiness evaluation.
    """
    width, height = img.size
    
    # 1. Read DPI metadata
    dpi_raw = img.info.get("dpi") or img.info.get("resolution")
    has_dpi_metadata = False
    dpi_x, dpi_y = 72.0, 72.0
    
    if dpi_raw:
        if isinstance(dpi_raw, (tuple, list)) and len(dpi_raw) >= 2:
            try:
                dpi_x = float(dpi_raw[0])
                dpi_y = float(dpi_raw[1])
                has_dpi_metadata = True
            except (ValueError, TypeError):
                pass
        elif isinstance(dpi_raw, (int, float)):
            dpi_x = float(dpi_raw)
            dpi_y = float(dpi_raw)
            has_dpi_metadata = True
            
    # Check PNG pHYs chunk if DPI not yet found
    if not has_dpi_metadata and "pHYs" in img.info:
        try:
            phys = img.info["pHYs"]
            if len(phys) >= 2 and phys[0] > 0 and phys[1] > 0:
                # 1 meter = 39.3700787 inches
                dpi_x = phys[0] / 39.3700787
                dpi_y = phys[1] / 39.3700787
                has_dpi_metadata = True
        except Exception:
            pass

    # Effective DPI rounded to integer
    effective_dpi = max(1, round(min(dpi_x, dpi_y)))
    if not has_dpi_metadata:
        # Default digital screen DPI
        effective_dpi = 72

    # Physical print dimensions at current DPI (Inches & CM)
    current_print_w_in = round(width / float(effective_dpi), 2)
    current_print_h_in = round(height / float(effective_dpi), 2)
    current_print_w_cm = round(current_print_w_in * 2.54, 1)
    current_print_h_cm = round(current_print_h_in * 2.54, 1)

    # Physical print dimensions at industrial 300 DPI standard
    standard_300_w_in = round(width / 300.0, 2)
    standard_300_h_in = round(height / 300.0, 2)
    standard_300_w_cm = round(standard_300_w_in * 2.54, 1)
    standard_300_h_cm = round(standard_300_h_in * 2.54, 1)

    # Check for transparency (Alpha channel)
    has_alpha = False
    is_pure_transparent = False
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        try:
            alpha = img.convert("RGBA").split()[-1]
            extrema = alpha.getextrema()
            if extrema:
                min_a, max_a = extrema
                has_alpha = min_a < 255
                is_pure_transparent = min_a == 0
        except Exception:
            pass

    # Print Quality Assessment
    # Standards:
    # DTG Chest Print: 12"x16" to 15"x18" requires 3600-4500px wide @ 300 DPI
    if effective_dpi >= 300 and (width >= 3600 or height >= 4200):
        quality_score = 100
        grade = "EXCELLENT"
        grade_label = "Xuất Sắc — Đạt Chuẩn In DTG Công Nghiệp"
        status_color = "emerald"
        detail_desc = "Độ phân giải siêu nét, đạt chuẩn 300 DPI công nghiệp, in lên áo kích thước lớn 15x18 inch không bị vỡ hạt."
    elif effective_dpi >= 300 and (width >= 2000 or height >= 2000):
        quality_score = 85
        grade = "GOOD_HIGH_DPI"
        grade_label = "Tốt — 300 DPI Khổ Vừa"
        status_color = "blue"
        detail_desc = "Đã có metadata 300 DPI, in sắc nét ở cỡ ngực áo vừa (khoảng 8-10 inch). Khuyên dùng nâng cấp lên 4500x5400 px để phủ tràn áo."
    elif width >= 3000 or height >= 3000:
        quality_score = 75
        grade = "ACCEPTABLE"
        grade_label = "Khá — Độ Phân Giải Cao Nhưng Chưa Gán 300 DPI"
        status_color = "amber"
        detail_desc = f"Ảnh có kích thước lớn ({width}x{height} px) nhưng metadata chỉ là {effective_dpi} DPI. Cần úp sang 300 DPI để hệ thống xưởng in chấp nhận."
    elif width >= 1500 or height >= 1500:
        quality_score = 60
        grade = "MEDIUM"
        grade_label = "Trung Bình — Cần Nâng Cấp Chất Lượng"
        status_color = "amber"
        detail_desc = "Kích thước ở mức trung bình, in ra áo có thể bị giảm độ chi tiết hoặc răng cưa nhẹ ở các nét chữ mảnh."
    else:
        quality_score = 35
        grade = "POOR"
        grade_label = "Kém — Độ Phân Giải Thấp, Dễ Vỡ Hạt"
        status_color = "rose"
        detail_desc = "Độ phân giải quá nhỏ so với tiêu chuẩn in áo thun POD. Bắt buộc phải upscale lên 300 DPI trước khi in."

    # Diagnostic Recommendations
    recommendations = []
    if effective_dpi < 300:
        recommendations.append(
            f"⚠️ Chỉ số DPI hiện tại là {effective_dpi} DPI (chuẩn màn hình web). Các xưởng in POD như Merch by Amazon, Printful, Printify yêu cầu file phải chuẩn 300 DPI."
        )
    if width < DTG_TARGET_WIDTH or height < DTG_TARGET_HEIGHT:
        recommendations.append(
            f"📐 Kích thước {width}×{height} px chưa đạt chuẩn vàng DTG (4500×5400 px). Nên chuyển sang khổ 4500×5400 px để tối ưu vùng in ngực áo."
        )
    if not has_alpha:
        recommendations.append(
            "🎨 Ảnh chưa có nền trong suốt (Alpha = 0). Nếu in lên áo màu đen hoặc sẫm màu, nên bật tính năng tách nền tự động để tránh bị dính mảng trắng bao quanh."
        )
    else:
        recommendations.append(
            "✅ File đã có nền trong suốt hoàn hảo, sẵn sàng in trực tiếp trên mọi màu áo (Trắng, Đen, Xanh than, Xám)."
        )

    return {
        "filename": filename or "artwork.png",
        "width": width,
        "height": height,
        "aspect_ratio": f"{round(width / height, 2)}:1" if height else "1:1",
        "dpi_x": round(dpi_x, 1),
        "dpi_y": round(dpi_y, 1),
        "effective_dpi": effective_dpi,
        "has_dpi_metadata": has_dpi_metadata,
        "print_size_at_current_dpi": {
            "inches": f"{current_print_w_in}\" × {current_print_h_in}\"",
            "cm": f"{current_print_w_cm} × {current_print_h_cm} cm",
            "width_in": current_print_w_in,
            "height_in": current_print_h_in,
            "width_cm": current_print_w_cm,
            "height_cm": current_print_h_cm
        },
        "print_size_at_300dpi": {
            "inches": f"{standard_300_w_in}\" × {standard_300_h_in}\"",
            "cm": f"{standard_300_w_cm} × {standard_300_h_cm} cm",
            "width_in": standard_300_w_in,
            "height_in": standard_300_h_in,
            "width_cm": standard_300_w_cm,
            "height_cm": standard_300_h_cm
        },
        "has_alpha": has_alpha,
        "is_pure_transparent": is_pure_transparent,
        "mode": img.mode,
        "file_size_kb": round(file_size_bytes / 1024, 1) if file_size_bytes else None,
        "quality_score": quality_score,
        "grade": grade,
        "grade_label": grade_label,
        "detail_desc": detail_desc,
        "status_color": status_color,
        "is_ready_for_pod": effective_dpi >= 300 and width >= 3000,
        "recommendations": recommendations
    }

def inspect_image_file(file_path: str) -> Dict[str, Any]:
    """Inspects DPI and quality metrics from a file path."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    file_size = os.path.getsize(file_path)
    with Image.open(file_path) as img:
        return inspect_image_dpi(img, file_size_bytes=file_size, filename=os.path.basename(file_path))

def apply_smart_sharpening(img: Image.Image) -> Image.Image:
    """
    Tối ưu độ sắc nét cho viền chữ và texture typography.
    Tách biệt kênh Alpha để không làm hỏng rìa trong suốt.
    """
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    r, g, b, a = img.split()
    rgb = Image.merge("RGB", (r, g, b))

    # Tăng cường viền chữ bằng UnsharpMask cân bằng (không gây viền trắng viền halo)
    sharpened_rgb = rgb.filter(ImageFilter.UnsharpMask(radius=1.8, percent=130, threshold=2))

    # Tăng độ tương phản nhẹ 4% để chữ và họa tiết nổi bật trên nền vải
    enhancer = ImageEnhance.Contrast(sharpened_rgb)
    enhanced_rgb = enhancer.enhance(1.04)

    return Image.merge("RGBA", (*enhanced_rgb.split(), a))


def upscale_image_to_300dpi(
    input_img: Image.Image,
    target_mode: str = "dtg_standard",
    target_width: Optional[int] = None,
    target_height: Optional[int] = None,
    enhance_sharpness: bool = True,
    auto_remove_background: bool = False,
    output_dir: str = str(ARTWORKS_DIR),
    prefix: str = "upscale_300dpi"
) -> Dict[str, Any]:
    os.makedirs(output_dir, exist_ok=True)
    artwork_id = f"up300_{uuid.uuid4().hex[:10]}"
    
    # 1. Đánh giá chất lượng file gốc
    before_metrics = inspect_image_dpi(input_img)
    
    # 2. Chuẩn hóa format sang RGBA ngay từ đầu để giữ trong suốt xuyên suốt quá trình
    if input_img.mode != "RGBA":
        working_img = input_img.convert("RGBA")
    else:
        working_img = input_img.copy()

    # Tách nền tự động nếu người dùng yêu cầu và ảnh chưa có nền trong suốt
    if auto_remove_background and not before_metrics["has_alpha"]:
        try:
            working_img = extract_transparent_artwork(working_img)
            if working_img.mode != "RGBA":
                working_img = working_img.convert("RGBA")
        except Exception as e:
            print(f"[DPI Upscaler] Auto background removal warning: {e}")

    orig_w, orig_h = working_img.size

    # 3. Tính toán kích thước theo target_mode
    if target_mode == "dtg_standard":
        canvas_w, canvas_h = DTG_TARGET_WIDTH, DTG_TARGET_HEIGHT
        padding_pct = 0.08  # Chừa lề an toàn 8% ngực áo
        max_inner_w = int(canvas_w * (1.0 - 2 * padding_pct))
        max_inner_h = int(canvas_h * (1.0 - 2 * padding_pct))

        ratio = min(max_inner_w / orig_w, max_inner_h / orig_h)
        scaled_w = max(10, int(orig_w * ratio))
        scaled_h = max(10, int(orig_h * ratio))

        # Resize chất lượng cao
        scaled_art = working_img.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
        if enhance_sharpness:
            scaled_art = apply_smart_sharpening(scaled_art)

        # Tạo Master Canvas 4500x5400 px trong suốt hoàn toàn
        final_img = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
        offset_x = (canvas_w - scaled_w) // 2
        offset_y = int((canvas_h - scaled_h) * 0.44)  # Đặt trọng tâm thị giác hơi chếch lên trên ngực áo

        # Paste an toàn bằng alpha mask tách rời
        final_img.paste(scaled_art, (offset_x, offset_y), mask=scaled_art.split()[-1])

    elif target_mode == "proportional_300dpi":
        target_max = target_width or 4500
        ratio = target_max / max(orig_w, orig_h)
        new_w = max(10, int(orig_w * ratio))
        new_h = max(10, int(orig_h * ratio))
        final_img = working_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        if enhance_sharpness:
            final_img = apply_smart_sharpening(final_img)

    elif target_mode == "scale_2x":
        final_img = working_img.resize((orig_w * 2, orig_h * 2), Image.Resampling.LANCZOS)
        if enhance_sharpness:
            final_img = apply_smart_sharpening(final_img)

    elif target_mode == "scale_4x":
        final_img = working_img.resize((orig_w * 4, orig_h * 4), Image.Resampling.LANCZOS)
        if enhance_sharpness:
            final_img = apply_smart_sharpening(final_img)

    elif target_mode == "custom" and target_width and target_height:
        final_img = working_img.resize((target_width, target_height), Image.Resampling.LANCZOS)
        if enhance_sharpness:
            final_img = apply_smart_sharpening(final_img)

    else:
        # Fallback về chuẩn DTG 4500x5400
        return upscale_image_to_300dpi(
            input_img=input_img,
            target_mode="dtg_standard",
            enhance_sharpness=enhance_sharpness,
            auto_remove_background=auto_remove_background,
            output_dir=output_dir,
            prefix=prefix
        )

    # 4. Ghi file Master PNG đính kèm Metadata 300 DPI chính xác
    master_filename = f"{artwork_id}_master_300dpi.png"
    master_path = os.path.join(output_dir, master_filename)

    final_img.save(
        master_path,
        format="PNG",
        dpi=(DTG_TARGET_DPI, DTG_TARGET_DPI),
        optimize=True
    )

    # 5. Tạo ảnh Preview hiển thị web nhẹ nhàng (1200px)
    preview_w = 1200
    preview_ratio = preview_w / final_img.width
    preview_h = max(10, int(final_img.height * preview_ratio))
    preview_img = final_img.resize((preview_w, preview_h), Image.Resampling.LANCZOS)

    preview_filename = f"{artwork_id}_preview.png"
    preview_path = os.path.join(output_dir, preview_filename)
    preview_img.save(preview_path, format="PNG", optimize=True)

    # 6. Đọc lại trực tiếp từ file đĩa để đảm bảo metadata EXIF/pHYs đã ghi thành công
    after_file_size = os.path.getsize(master_path)
    with Image.open(master_path) as saved_img:
        after_metrics = inspect_image_dpi(saved_img, file_size_bytes=after_file_size, filename=master_filename)

    return {
        "success": True,
        "artwork_id": artwork_id,
        "target_mode": target_mode,
        "master_path": master_path,
        "preview_path": preview_path,
        "master_url": f"/static/artworks/{master_filename}",
        "preview_url": f"/static/artworks/{preview_filename}",
        "before": before_metrics,
        "after": after_metrics,
        "summary": f"Nâng cấp thành công từ {orig_w}×{orig_h} px ({before_metrics['effective_dpi']} DPI) lên {final_img.width}×{final_img.height} px ({after_metrics['effective_dpi']} DPI)."
    }

