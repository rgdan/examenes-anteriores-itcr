import hashlib
import os
import shutil
import tkinter as tk
from tkinter import messagebox, ttk
import fitz  # PyMuPDF
from PIL import Image, ImageTk


class PDFRenamerApp:

    def __init__(self, root):
        self.root = root
        self.root.title("PDF Multi-Page Exam Renamer")

        # --- MAKE WINDOW FULLSCREEN / MAXIMIZED ---
        try:
            self.root.state("zoomed")  # Works on Windows/Linux
        except tk.TclError:
            screen_width = self.root.winfo_screenwidth()
            screen_height = self.root.winfo_screenheight()
            self.root.geometry(f"{screen_width}x{screen_height}+0+0")

        # Get all PDF files in the current working directory
        self.pdf_files = [f for f in os.listdir(".") if f.lower().endswith(".pdf")]
        self.current_index = 0
        self.current_page = 0
        self.doc = None

        if not self.pdf_files:
            messagebox.showinfo(
                "No PDFs Found", "No PDF files found in the current directory."
            )
            self.root.destroy()
            return

        self.setup_ui()
        self.load_pdf_file()

        # Keyboard shortcuts for quick paging
        self.root.bind("<Left>", lambda event: self.prev_page())
        self.root.bind("<Right>", lambda event: self.next_page())

    def setup_ui(self):
        self.root.grid_rowconfigure(0, weight=1)
        self.root.grid_columnconfigure(0, weight=1)

        main_frame = ttk.Frame(self.root, padding="15")
        main_frame.grid(row=0, column=0, sticky="nsew")
        main_frame.grid_columnconfigure(0, weight=3)  # Preview gets 75% width
        main_frame.grid_columnconfigure(1, weight=1)  # Controls get 25% width
        main_frame.grid_rowconfigure(0, weight=1)

        # --- LEFT SIDE: PDF PREVIEW ---
        self.preview_frame = ttk.LabelFrame(
            main_frame, text=" Vista Previa del Documento ", padding="10"
        )
        self.preview_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 10))

        self.image_label = ttk.Label(
            self.preview_frame, text="Loading preview...", anchor="center"
        )
        self.image_label.pack(fill=tk.BOTH, expand=True)

        # Page Navigation Bar inside preview container
        page_nav_frame = ttk.Frame(self.preview_frame, padding="5")
        page_nav_frame.pack(side=tk.BOTTOM, fill=tk.X, pady=(5, 0))

        center_nav = ttk.Frame(page_nav_frame)
        center_nav.pack(anchor=tk.CENTER)

        self.btn_prev_page = ttk.Button(
            center_nav, text="◀ Pág. Anterior", command=self.prev_page
        )
        self.btn_prev_page.pack(side=tk.LEFT, padx=10)

        self.lbl_page_counter = ttk.Label(
            center_nav, text="Página 0 de 0", font=("Arial", 10, "bold")
        )
        self.lbl_page_counter.pack(side=tk.LEFT, padx=15)

        self.btn_next_page = ttk.Button(
            center_nav, text="Pág. Siguiente ▶", command=self.next_page
        )
        self.btn_next_page.pack(side=tk.LEFT, padx=10)

        # --- RIGHT SIDE: CONTROLS ---
        control_frame = ttk.Frame(main_frame, padding="15")
        control_frame.grid(row=0, column=1, sticky="nsew")

        self.lbl_current_file = ttk.Label(
            control_frame, text="", font=("Arial", 11, "bold"), wraplength=350
        )
        self.lbl_current_file.pack(pady=(0, 20))

        # Naming Fields
        ttk.Label(
            control_frame, text="Tipo de Examen:", font=("Arial", 10, "bold")
        ).pack(anchor=tk.W, pady=2)
        self.var_tipo = tk.StringVar(value="P1")
        self.cb_tipo = ttk.Combobox(
            control_frame,
            textvariable=self.var_tipo,
            values=["P1", "P2", "P3", "RP", "S"],
            state="readonly",
            font=("Arial", 10),
        )
        self.cb_tipo.pack(fill=tk.X, pady=(0, 12))

        ttk.Label(
            control_frame, text="Semestre:", font=("Arial", 10, "bold")
        ).pack(anchor=tk.W, pady=2)
        self.var_semestre = tk.StringVar(value="IS")
        self.cb_semestre = ttk.Combobox(
            control_frame,
            textvariable=self.var_semestre,
            values=["IS", "IIS"],
            state="readonly",
            font=("Arial", 10),
        )
        self.cb_semestre.pack(fill=tk.X, pady=(0, 12))

        ttk.Label(control_frame, text="Año:", font=("Arial", 10, "bold")).pack(
            anchor=tk.W, pady=2
        )
        self.var_ano = tk.StringVar(value="2026")
        self.ent_ano = ttk.Entry(
            control_frame, textvariable=self.var_ano, font=("Arial", 10)
        )
        self.ent_ano.pack(fill=tk.X, pady=(0, 12))

        ttk.Label(
            control_frame, text="Naturaleza del Archivo:", font=("Arial", 10, "bold")
        ).pack(anchor=tk.W, pady=2)
        self.var_doc = tk.StringVar(value="E")
        rb_frame = ttk.Frame(control_frame)
        rb_frame.pack(fill=tk.X, pady=(0, 12))
        ttk.Radiobutton(
            rb_frame, text="Enunciado (E)", variable=self.var_doc, value="E"
        ).pack(side=tk.LEFT, padx=(0, 15))
        ttk.Radiobutton(
            rb_frame, text="Solución (S)", variable=self.var_doc, value="S"
        ).pack(side=tk.LEFT)

        self.var_extra = tk.BooleanVar(value=False)
        self.chk_extra = ttk.Checkbutton(
            control_frame, text="¿Es Extraordinario? (_E)", variable=self.var_extra
        )
        self.chk_extra.pack(anchor=tk.W, pady=(0, 20))

        # Core Action Buttons
        btn_rename = ttk.Button(
            control_frame, text="Renombrar y Siguiente", command=self.rename_current
        )
        btn_rename.pack(fill=tk.X, ipady=6, pady=3)

        btn_skip = ttk.Button(
            control_frame, text="Saltar Archivo", command=self.next_file
        )
        btn_skip.pack(fill=tk.X, ipady=6, pady=3)

        # File Quarantine Action
        btn_quarantine = ttk.Button(
            control_frame, text="⚠️ Mover a Cuarentena", command=self.quarantine_current
        )
        btn_quarantine.pack(fill=tk.X, ipady=6, pady=(3, 25))

        # Bottom Frame Tools (Contains Progress & Duplicate Check)
        bottom_tools = ttk.Frame(control_frame)
        bottom_tools.pack(side=tk.BOTTOM, fill=tk.X)

        btn_scan_dup = ttk.Button(
            bottom_tools, text="🔍 Escanear Duplicados", command=self.scan_for_duplicates
        )
        btn_scan_dup.pack(fill=tk.X, ipady=6, pady=(10, 0))

        self.lbl_progress = ttk.Label(
            bottom_tools, text="", font=("Arial", 10, "italic")
        )
        self.lbl_progress.pack(pady=5)

    def load_pdf_file(self):
        """Loads a fresh PDF file and resets the page index counter to zero."""
        if self.current_index >= len(self.pdf_files):
            if self.doc:
                self.doc.close()
            messagebox.showinfo("¡Listo!", "Se han procesado todos los archivos PDF.")
            self.root.destroy()
            return

        filename = self.pdf_files[self.current_index]
        self.lbl_current_file.config(text=f"Archivo actual:\n{filename}")
        self.lbl_progress.config(
            text=f"Progreso: {self.current_index + 1} / {len(self.pdf_files)}"
        )

        try:
            if self.doc:
                self.doc.close()
            self.doc = fitz.open(filename)
            self.current_page = 0
            self.render_page()
        except Exception as e:
            self.image_label.config(
                image="", text=f"Error al cargar vista previa:\n{str(e)}"
            )

    def render_page(self):
        if not self.doc:
            return

        total_pages = len(self.doc)
        self.lbl_page_counter.config(
            text=f"Página {self.current_page + 1} de {total_pages}"
        )

        self.btn_prev_page.config(
            state=tk.NORMAL if self.current_page > 0 else tk.DISABLED
        )
        self.btn_next_page.config(
            state=tk.NORMAL if self.current_page < total_pages - 1 else tk.DISABLED
        )

        self.root.update_idletasks()
        max_w = self.preview_frame.winfo_width() - 30
        max_h = self.preview_frame.winfo_height() - 80

        try:
            page = self.doc.load_page(self.current_page)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            img.thumbnail((max_w, max_h))
            self.photo_img = ImageTk.PhotoImage(img)
            self.image_label.config(image=self.photo_img, text="")
        except Exception as e:
            self.image_label.config(
                image="", text=f"Error al renderizar página:\n{str(e)}"
            )

    def next_page(self):
        if self.doc and self.current_page < len(self.doc) - 1:
            self.current_page += 1
            self.render_page()

    def prev_page(self):
        if self.doc and self.current_page > 0:
            self.current_page -= 1
            self.render_page()

    def rename_current(self):
        current_name = self.pdf_files[self.current_index]

        tipo_num = self.var_tipo.get()
        semestre = self.var_semestre.get()
        ano = self.var_ano.get().strip()
        tipo_doc = self.var_doc.get()
        extra_flag = "_E" if self.var_extra.get() else ""

        if not ano or not ano.isdigit():
            messagebox.showerror("Error", "Por favor ingrese un año válido de 4 dígitos.")
            return

        tipo = "P" if tipo_num.startswith("P") else tipo_num
        num = tipo_num[1:] if tipo_num.startswith("P") else ""
        new_name = f"{tipo}{num}_{semestre}_{ano}_{tipo_doc}{extra_flag}.pdf"

        if os.path.exists(new_name) and current_name != new_name:
            if not messagebox.askyesno(
                "Advertencia",
                f"El archivo '{new_name}' ya existe.\n¿Desea reemplazarlo?",
            ):
                return

        try:
            if self.doc:
                self.doc.close()
                self.doc = None
            os.rename(current_name, new_name)
            # Remove from list and maintain current index pointing to next entry
            self.pdf_files.pop(self.current_index)
            self.load_pdf_file()
        except Exception as e:
            messagebox.showerror("Error de Archivo", f"No se pudo renombrar:\n{str(e)}")
            self.doc = fitz.open(current_name)
            self.render_page()

    def next_file(self):
        self.current_index += 1
        self.var_extra.set(False)
        self.load_pdf_file()

    def quarantine_current(self):
        """Moves current PDF into a 'quarentine' subdirectory."""
        current_name = self.pdf_files[self.current_index]
        folder_name = "quarentine"

        if not os.path.exists(folder_name):
            os.makedirs(folder_name)

        try:
            if self.doc:
                self.doc.close()
                self.doc = None

            dest_path = os.path.join(folder_name, current_name)
            shutil.move(current_name, dest_path)

            # Pop the record out since it's no longer in working folder root
            self.pdf_files.pop(self.current_index)
            self.var_extra.set(False)
            self.load_pdf_file()
        except Exception as e:
            messagebox.showerror(
                "Error de Aislamiento", f"No se pudo mover a cuarentena:\n{str(e)}"
            )
            self.doc = fitz.open(current_name)
            self.render_page()

    def scan_for_duplicates(self):
        """Calculates MD5 hash footprints to map out duplicate items."""
        hashes = {}
        duplicates = []

        # Fresh crawl of whatever PDFs currently exist in root directory
        all_pdfs = [f for f in os.listdir(".") if f.lower().endswith(".pdf")]

        for filename in all_pdfs:
            try:
                hasher = hashlib.md5()
                with open(filename, "rb") as f:
                    buf = f.read(4096)
                    while len(buf) > 0:
                        hasher.update(buf)
                        buf = f.read(4096)
                file_hash = hasher.hexdigest()

                if file_hash in hashes:
                    duplicates.append((filename, hashes[file_hash]))
                else:
                    hashes[file_hash] = filename
            except Exception:
                continue

        if not duplicates:
            messagebox.showinfo("Escaneo Terminado", "No se hallaron archivos duplicados.")
            return

        self.show_duplicates_window(duplicates)

    def show_duplicates_window(self, duplicates):
        """Popup modal windows listing duplicate targets for direct removal management."""
        dup_win = tk.Toplevel(self.root)
        dup_win.title("Duplicados Encontrados")
        dup_win.geometry("600x400")
        dup_win.grab_set()  # Focus locks interaction on modal window

        ttk.Label(
            dup_win,
            text="Se detectaron los siguientes duplicados exactos:",
            font=("Arial", 11, "bold"),
        ).pack(pady=10)

        # Table Layout Container
        frame = ttk.Frame(dup_win)
        frame.pack(fill=tk.BOTH, expand=True, padx=15, pady=5)

        tree = ttk.Treeview(
            frame, columns=("Duplicado", "Original"), show="headings", selectmode="browse"
        )
        tree.heading("Duplicado", text="Archivo Duplicado")
        tree.heading("Original", text="Original Conservado")
        tree.column("Duplicado", width=270)
        tree.column("Original", width=270)
        tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        scrollbar = ttk.Scrollbar(frame, orient=tk.VERTICAL, command=tree.yview)
        tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        for dup, orig in duplicates:
            tree.insert("", tk.END, values=(dup, orig))

        def delete_selected():
            selected_item = tree.focus()
            if not selected_item:
                messagebox.showwarning("Selección", "Por favor elija un registro de la lista.")
                return

            values = tree.item(selected_item, "values")
            dup_filename = values[0]

            if messagebox.askyesno(
                "Eliminar", f"¿Eliminar definitivamente '{dup_filename}'?"
            ):
                try:
                    # If active open file is selected to be dropped, close pointer stream
                    if (
                        self.current_index < len(self.pdf_files)
                        and self.pdf_files[self.current_index] == dup_filename
                    ):
                        if self.doc:
                            self.doc.close()
                            self.doc = None

                    os.remove(dup_filename)
                    tree.delete(selected_item)

                    # Sync primary processing array reference pointers dynamically
                    if dup_filename in self.pdf_files:
                        self.pdf_files.remove(dup_filename)

                    # Reload whatever tracking loop target pointer context expects next
                    if self.current_index >= len(self.pdf_files):
                        self.current_index = max(0, len(self.pdf_files) - 1)
                    self.load_pdf_file()

                    messagebox.showinfo("Éxito", "Archivo eliminado correctamente.")
                except Exception as e:
                    messagebox.showerror("Error", f"No se pudo eliminar:\n{str(e)}")

        btn_delete = ttk.Button(
            dup_win, text="Eliminar Duplicado Seleccionado", command=delete_selected
        )
        btn_delete.pack(pady=15, ipady=5)


if __name__ == "__main__":
    root = tk.Tk()
    app = PDFRenamerApp(root)
    root.mainloop()
