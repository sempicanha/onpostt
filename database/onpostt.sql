--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-07-13 04:35:31

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 16552)
-- Name: blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocks (
    id text NOT NULL,
    pubkey text NOT NULL,
    created_at integer NOT NULL,
    mode text NOT NULL,
    content jsonb,
    sig text NOT NULL,
    app text,
    query jsonb,
    deleted boolean DEFAULT false,
    "to" text,
    "from" text
);


ALTER TABLE public.blocks OWNER TO postgres;

--
-- TOC entry 4696 (class 2606 OID 16559)
-- Name: blocks blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_pkey PRIMARY KEY (id);


--
-- TOC entry 4697 (class 1259 OID 16560)
-- Name: idx_blocks_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blocks_created_at ON public.blocks USING btree (created_at);


--
-- TOC entry 4698 (class 1259 OID 16561)
-- Name: idx_blocks_from; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blocks_from ON public.blocks USING btree ("from");


--
-- TOC entry 4699 (class 1259 OID 16562)
-- Name: idx_blocks_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blocks_id ON public.blocks USING btree (id);


--
-- TOC entry 4700 (class 1259 OID 16563)
-- Name: idx_blocks_mode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blocks_mode ON public.blocks USING btree (mode);


--
-- TOC entry 4701 (class 1259 OID 16564)
-- Name: idx_blocks_pubkey; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blocks_pubkey ON public.blocks USING btree (pubkey);


--
-- TOC entry 4702 (class 1259 OID 16565)
-- Name: idx_blocks_to; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blocks_to ON public.blocks USING btree ("to");


-- Completed on 2025-07-13 04:35:31

--
-- PostgreSQL database dump complete
--

