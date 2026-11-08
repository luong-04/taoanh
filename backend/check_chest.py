from PIL import Image
import numpy as np

# 1. Flatlay
im_flat = Image.open("backend/templates/garment_black.png")
w, h = im_flat.size
print("Flatlay size:", w, h)
# Collar is around Y=450..550, Chest is around Y=750..1550, Center X=1000
# Target width: ~700 px (35% of 2000)

# 2. Lifestyle model
im_model = Image.open("backend/templates/lifestyle_texas_ranch.png")
w, h = im_model.size
print("Model size:", w, h)
# Model face/chin is around Y=600..700, Collar is around Y=800..900, Chest is Y=1000..1700, Center X=1000
# Target width: ~680 px (34% of 2000)

