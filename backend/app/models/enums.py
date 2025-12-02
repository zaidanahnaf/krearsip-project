# app/models/enums.py
from enum import Enum

class StatusKarya(str, Enum):
    draft = "draft"
    on_chain = "on_chain"
    terverifikasi = "terverifikasi"


class StatusOnchain(str, Enum):
    tidak_ada = "tidak ada"
    dalam_antrian = "dalam antrian"
    menunggu = "menunggu"
    berhasil = "berhasil"
    gagal = "gagal"
