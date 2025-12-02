-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.api (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pengguna_id uuid,
  key_hash character varying NOT NULL,
  cakupan character varying,
  created_at timestamp with time zone DEFAULT now(),
  revoked_at timestamp with time zone,
  CONSTRAINT api_pkey PRIMARY KEY (id),
  CONSTRAINT kunci_api_pengguna_id_fkey FOREIGN KEY (pengguna_id) REFERENCES public.pengguna(id)
);
CREATE TABLE public.auth_nonce (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  alamat_wallet character varying NOT NULL,
  nonce character varying NOT NULL,
  expired_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT auth_nonce_pkey PRIMARY KEY (id)
);
CREATE TABLE public.catatan_audit (
  id bigint NOT NULL DEFAULT nextval('catatan_audit_id_seq'::regclass),
  pengguna_id uuid,
  aksi character varying NOT NULL,
  muatan jsonb,
  ip_address inet,
  user_agent character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT catatan_audit_pkey PRIMARY KEY (id),
  CONSTRAINT catatan_audit_pengguna_id_fkey FOREIGN KEY (pengguna_id) REFERENCES public.pengguna(id)
);
CREATE TABLE public.karya (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pengguna_id uuid,
  judul character varying NOT NULL,
  hash_berkas character NOT NULL CHECK (hash_berkas ~ '^[0-9a-f]{64}$'::text),
  cid_ipfs character varying,
  tx_hash character varying CHECK (tx_hash IS NULL OR tx_hash::text ~ '^0x[0-9a-f]{64}$'::text),
  alamat_kontrak character varying CHECK (alamat_kontrak IS NULL OR alamat_kontrak::text ~ '^0x[0-9a-f]{40}$'::text),
  jaringan_ket character varying DEFAULT 'sepolia'::character varying,
  waktu_blok timestamp with time zone,
  status USER-DEFINED DEFAULT 'draft'::status_karya,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  block_number bigint,
  verified_at timestamp with time zone,
  verified_by uuid,
  alasan_penolakan text,
  status_onchain USER-DEFINED NOT NULL DEFAULT 'tidak ada'::status_onchain,
  CONSTRAINT karya_pkey PRIMARY KEY (id),
  CONSTRAINT karya_pengguna_id_fkey FOREIGN KEY (pengguna_id) REFERENCES public.pengguna(id),
  CONSTRAINT karya_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.pengguna(id)
);
CREATE TABLE public.pengguna (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  alamat_wallet character varying NOT NULL UNIQUE CHECK (alamat_wallet::text ~ '^0x[0-9a-f]{40}$'::text),
  email character varying UNIQUE CHECK (email IS NULL OR email::text ~ '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'::text),
  nama_tampil character varying,
  peran USER-DEFINED DEFAULT 'pencipta'::peran_pengguna,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pengguna_pkey PRIMARY KEY (id)
);