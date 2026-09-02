import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── Tipos ──────────────────────────────────────────────────────────────────────

/** Tipos de imagen aceptados por el backend */
export type ImageType = 'student' | 'teacher' | 'parent';

export interface ImageUploadPayload {
  /** Tipo: student | teacher | parent → determina la subcarpeta en iit-pickup-fotos */
  type: ImageType;
  /** ID único del recurso (studentId, teacherId, parentId) */
  identifier?: string;
  /** Nombre legible adicional (nombre del alumno, slug, etc.) */
  extraName?: string;
  /** Base64 puro SIN prefijo data:image/... (se elimina automáticamente) */
  base64File: string;
}

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'limit' | 'scale' | 'fit' | 'thumb' | 'crop';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'jpg' | 'png' | 'avif';
  gravity?: 'auto' | 'face' | 'center';
  radius?: number | 'max';
}

// ── Constantes ─────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

// ── Servicio ───────────────────────────────────────────────────────────────────

/**
 * ImageUploadService — Gestiona subida de imágenes para IIT Pickup App.
 *
 * Características:
 *  - Convierte File → Base64 puro via FileReader (Web API nativa)
 *  - POST JSON al backend → POST /api/v1/images/upload
 *  - Fallback transparente: si Cloudinary no está disponible el backend guarda en disco
 *  - applyTransform(): inyecta parámetros Cloudinary en URLs existentes (resize, crop, etc.)
 *
 * Carpeta Cloudinary destino: iit-pickup-fotos/{students|teachers|parents}
 *
 * SOLID-S: solo conversión File->Base64, POST al backend, y utilidad de transformación.
 * SOLID-D: depende de HttpClient y environment (abstracciones), sin URLs hardcodeadas.
 */
@Injectable({ providedIn: 'root' })
export class ImageUploadService {

  private readonly http   = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/images/upload`;

  // ── API pública ────────────────────────────────────────────────────────────

  /**
   * Convierte un File a Base64 y lo sube al backend.
   * Devuelve la URL pública de Cloudinary (o URL local fallback).
   *
   * @param file       Archivo de imagen seleccionado por el usuario
   * @param type       Tipo: 'student' | 'teacher' | 'parent'
   * @param identifier ID único del recurso (studentId, etc.)
   * @param extraName  Nombre legible adicional
   */
  uploadFile(
    file: File,
    type: ImageType,
    identifier?: string,
    extraName?: string
  ): Observable<string> {
    if (!file) {
      return throwError(() => new Error('Debes seleccionar un archivo.'));
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return throwError(() => new Error('Solo se permiten imágenes (jpg, png, webp, gif, svg).'));
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return throwError(() => new Error(`La imagen no puede superar ${MAX_FILE_SIZE_MB} MB.`));
    }

    return from(this.fileToBase64(file)).pipe(
      switchMap(base64 => this.uploadBase64(base64, type, identifier, extraName))
    );
  }

  /**
   * Sube una imagen ya convertida a Base64 (con o sin prefijo data:image/...).
   */
  uploadBase64(
    base64: string,
    type: ImageType,
    identifier?: string,
    extraName?: string
  ): Observable<string> {
    const payload: ImageUploadPayload = {
      type,
      identifier,
      extraName,
      base64File: this.stripDataUrlPrefix(base64),
    };
    return this.http.post(this.apiUrl, payload, { responseType: 'text' });
  }

  /**
   * Aplica transformaciones dinámicas sobre una URL de Cloudinary.
   *
   * Inyecta los parámetros DESPUÉS de "/upload/" en la URL.
   * Si la URL no es de Cloudinary, la retorna sin modificar (seguro para fallback local).
   *
   * @example
   *   // Avatar cuadrado 200x200 con detección de cara
   *   const thumb = imageUpload.applyTransform(avatarUrl, {
   *     width: 200, height: 200, crop: 'fill', gravity: 'face', format: 'auto', quality: 'auto'
   *   });
   */
  applyTransform(url: string, opts: CloudinaryTransformOptions): string {
    if (!url || !url.includes('res.cloudinary.com')) return url;

    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;

    const transforms = this.buildTransformString(opts);
    return transforms ? `${parts[0]}/upload/${transforms}/${parts[1]}` : url;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /** Convierte un File a Base64 string usando FileReader (incluye prefijo data:image/...). */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Error leyendo el archivo.'));
      reader.readAsDataURL(file);
    });
  }

  /** Elimina el prefijo "data:image/xxx;base64," para enviar solo el Base64 puro. */
  private stripDataUrlPrefix(raw: string): string {
    return raw.includes(',') ? raw.split(',')[1] : raw;
  }

  /** Construye el string de transformación: "w_200,h_200,c_fill,g_face,q_auto,f_auto" */
  private buildTransformString(opts: CloudinaryTransformOptions): string {
    const parts: string[] = [];
    if (opts.width)           parts.push(`w_${opts.width}`);
    if (opts.height)          parts.push(`h_${opts.height}`);
    if (opts.crop)            parts.push(`c_${opts.crop}`);
    if (opts.gravity)         parts.push(`g_${opts.gravity}`);
    if (opts.quality != null) parts.push(`q_${opts.quality}`);
    if (opts.format)          parts.push(`f_${opts.format}`);
    if (opts.radius != null)  parts.push(`r_${opts.radius}`);
    return parts.join(',');
  }
}
