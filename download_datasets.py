import os
import zipfile
import shutil
import sys
from pathlib import Path
 
# ─── Folder Structure ────────────────────────────────────────────────────────
 
BASE_DATA_DIR = Path("data")
DIRS = {
    "symptoms":   BASE_DATA_DIR / "symptoms",
    "brain_mri":  BASE_DATA_DIR / "brain_mri",
    "chest_xray": BASE_DATA_DIR / "chest_xray",
    "liver":      BASE_DATA_DIR / "liver",
}
 
DATASETS = [
    {
        "name":        "symptoms",
        "kaggle_path": "itachi9604/disease-symptom-description-dataset",
        "type":        "dataset",
        "dest":        DIRS["symptoms"],
        "check_file":  "dataset.csv",
    },
    {
        "name":        "brain_mri",
        "kaggle_path": "masoudnickparvar/brain-tumor-mri-dataset",
        "type":        "dataset",
        "dest":        DIRS["brain_mri"],
        "check_file":  None,  # folder-based dataset
    },
    {
        "name":        "chest_xray",
        "kaggle_path": "paultimothymooney/chest-xray-pneumonia",
        "type":        "dataset",
        "dest":        DIRS["chest_xray"],
        "check_file":  None,
    },
    {
        "name":        "liver",
        "kaggle_path": "uciml/indian-liver-patient-records",
        "type":        "dataset",
        "dest":        DIRS["liver"],
        "check_file":  "indian_liver_patient.csv",
    },
]
 
# ─── Helpers ─────────────────────────────────────────────────────────────────
 
def check_kaggle():
    """Verify kaggle package and credentials."""
    try:
        import kaggle  # noqa: F401
    except ImportError:
        print("❌  kaggle package not found. Run: pip install kaggle")
        sys.exit(1)
 
    kaggle_json = Path.home() / ".kaggle" / "kaggle.json"
    if not kaggle_json.exists():
        print(f"❌  kaggle.json not found at {kaggle_json}")
        print("    Download it from https://www.kaggle.com/account → API → Create New Token")
        print("    Place it at ~/.kaggle/kaggle.json  (Mac/Linux)")
        print("    or  C:\\Users\\<you>\\.kaggle\\kaggle.json  (Windows)")
        sys.exit(1)
 
    # Fix permissions on Unix
    if os.name != "nt":
        os.chmod(kaggle_json, 0o600)
 
    print("✅  Kaggle credentials found.")
 
 
def already_downloaded(dest: Path, check_file) -> bool:
    if not dest.exists():
        return False
    if check_file:
        return (dest / check_file).exists()
    # For image datasets, check that at least one subdir exists
    subdirs = [x for x in dest.iterdir() if x.is_dir()]
    return len(subdirs) > 0
 
 
def download_and_extract(dataset: dict):
    from kaggle.api.kaggle_api_extended import KaggleApi
 
    name        = dataset["name"]
    kaggle_path = dataset["kaggle_path"]
    dest        = dataset["dest"]
    check_file  = dataset["check_file"]
 
    dest.mkdir(parents=True, exist_ok=True)
 
    if already_downloaded(dest, check_file):
        print(f"⏭️   [{name}] Already downloaded — skipping.")
        return
 
    print(f"\n📥  [{name}] Downloading from Kaggle: {kaggle_path} ...")
 
    api = KaggleApi()
    api.authenticate()
 
    # Download zip to dest
    api.dataset_download_files(kaggle_path, path=str(dest), unzip=False, quiet=False)
 
    # Unzip any .zip files found in dest
    zips = list(dest.glob("*.zip"))
    if not zips:
        # Sometimes kaggle auto-extracts; handle gracefully
        print(f"    No zip found for [{name}]; assuming direct extraction.")
        return
 
    for z in zips:
        print(f"    📂 Unzipping {z.name} ...")
        with zipfile.ZipFile(z, "r") as zf:
            zf.extractall(dest)
        z.unlink()
 
    # Flatten nested single-folder structures
    _flatten_single_subdir(dest)
 
    print(f"✅  [{name}] Done → {dest}")
 
 
def _flatten_single_subdir(dest: Path):
    """If extraction created a single subdirectory, move its contents up."""
    children = list(dest.iterdir())
    if len(children) == 1 and children[0].is_dir():
        inner = children[0]
        for item in inner.iterdir():
            shutil.move(str(item), str(dest / item.name))
        inner.rmdir()
 
 
# ─── Main ────────────────────────────────────────────────────────────────────
 
def main():
    print("=" * 60)
    print("  OmniHealth AI — Dataset Downloader")
    print("=" * 60)
 
    check_kaggle()
 
    BASE_DATA_DIR.mkdir(exist_ok=True)
    Path("models").mkdir(exist_ok=True)
 
    for ds in DATASETS:
        try:
            download_and_extract(ds)
        except Exception as e:
            print(f"⚠️   [{ds['name']}] Error: {e}")
            print("     Check your Kaggle credentials and dataset path.")
 
    print("\n" + "=" * 60)
    print("  All datasets ready!")
    print("  Next: python train_all_models.py")
    print("=" * 60)
 
 
if __name__ == "__main__":
    main()
 
