import os
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
            self.root.state("zoomed")  # Works perfectly on Windows/Linux
        except tk.TclError:
            # Fallback for macOS
            screen_width = self.root.winfo_screenwidth()
            screen_height = self.root.winfo_screenheight()
            self.root.geometry(f"{screen_width}x{screen_height}+0+0")

        # Get all PDF files in the current working directory
        self.pdf_files = [f for f in os.listdir(".") if f.lower().endswith(".pdf")]
        self.current_index = 0
        self.current_page = 0  # Tracks the active page in the open PDF
        self.doc = None  # Holds active PyMuPDF document reference

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
        # Configure root grid weights so it expands to the screen edge
        self.root.grid_rowconfigure(0, weight=1)
        self.root.grid_columnconfigure(0, weight=1)

        # Main frame grid configuration
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

        # Main center label displaying the PDF image canvas
        self.image_label = ttk.Label(
            self.preview_frame, text="Loading preview...", anchor="center"
        )
        self.image_label.pack(fill=tk.BOTH, expand=True)

        # Page Navigation Bar (Housed clean inside the bottom edge of the preview frame)
        page_nav_frame = ttk.Frame(self.preview_frame, padding="5")
        page_nav_frame.pack(side=tk.BOTTOM, fill=tk.X, pady=(5, 0))

        # Nested container to hold buttons dead-center
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

        # Current File Info
        self.lbl_current_file = ttk.Label(
            control_frame, text="", font=("Arial", 11, "bold"), wraplength=350
        )
        self.lbl_current_file.pack(pady=(0, 25))

        # 1. Tipo & Num
        ttk.Label(
            control_frame, text="Tipo de Examen:", font=("Arial", 10, "bold")
        ).pack(anchor=tk.W, pady=2)
        self.var_tipo = tk.StringVar(value="P1")
        tipos = ["P1", "P2", "P3", "RP", "S"]
        self.cb_tipo = ttk.Combobox(
            control_frame,
            textvariable=self.var_tipo,
            values=tipos,
            state="readonly",
            font=("Arial", 10),
        )
        self.cb_tipo.pack(fill=tk.X, pady=(0, 15))

        # 2. Semestre
        ttk.Label(
            control_frame, text="Semestre:", font=("Arial", 10, "bold")
        ).pack(anchor=tk.W, pady=2)
        self.var_semestre = tk.StringVar(value="IS")
        semestres = ["IS", "IIS"]
        self.cb_semestre = ttk.Combobox(
            control_frame,
            textvariable=self.var_semestre,
            values=semestres,
            state="readonly",
            font=("Arial", 10),
        )
        self.cb_semestre.pack(fill=tk.X, pady=(0, 15))

        # 3. Año
        ttk.Label(control_frame, text="Año:", font=("Arial", 10, "bold")).pack(
            anchor=tk.W, pady=2
        )
        self.var_ano = tk.StringVar(value="2026")
        self.ent_ano = ttk.Entry(
            control_frame, textvariable=self.var_ano, font=("Arial", 10)
        )
        self.ent_ano.pack(fill=tk.X, pady=(0, 15))

        # 4. Tipo de Documento
        ttk.Label(
            control_frame, text="Naturaleza del Archivo:", font=("Arial", 10, "bold")
        ).pack(anchor=tk.W, pady=2)
        self.var_doc = tk.StringVar(value="E")
        rb_frame = ttk.Frame(control_frame)
        rb_frame.pack(fill=tk.X, pady=(0, 15))
        ttk.Radiobutton(
            rb_frame, text="Enunciado (E)", variable=self.var_doc, value="E"
        ).pack(side=tk.LEFT, padx=(0, 15))
        ttk.Radiobutton(
            rb_frame, text="Solución (S)", variable=self.var_doc, value="S"
        ).pack(side=tk.LEFT)

        # 5. Extra (Extraordinario)
        self.var_extra = tk.BooleanVar(value=False)
        self.chk_extra = ttk.Checkbutton(
            control_frame, text="¿Es Extraordinario? (_E)", variable=self.var_extra
        )
        self.chk_extra.pack(anchor=tk.W, pady=(0, 30))

        # --- ACTION BUTTONS ---
        btn_rename = ttk.Button(
            control_frame, text="Renombrar y Siguiente", command=self.rename_current
        )
        btn_rename.pack(fill=tk.X, ipady=8, pady=5)

        btn_skip = ttk.Button(
            control_frame, text="Saltar Archivo", command=self.next_file
        )
        btn_skip.pack(fill=tk.X, ipady=8, pady=5)

        # Progress Label
        self.lbl_progress = ttk.Label(
            control_frame, text="", font=("Arial", 10, "italic")
        )
        self.lbl_progress.pack(side=tk.BOTTOM, pady=15)

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
                self.doc.close()  # Reset old open references safely

            self.doc = fitz.open(filename)
            self.current_page = 0
            self.render_page()
        except Exception as e:
            self.image_label.config(
                image="", text=f"Error al cargar vista previa:\n{str(e)}"
            )

    def render_page(self):
        """Handles drawing the specific current_page page of the loaded doc."""
        if not self.doc:
            return

        total_pages = len(self.doc)
        self.lbl_page_counter.config(
            text=f"Página {self.current_page + 1} de {total_pages}"
        )

        # Enable/Disable nav buttons safely based on context edge conditions
        self.btn_prev_page.config(
            state=tk.NORMAL if self.current_page > 0 else tk.DISABLED
        )
        self.btn_next_page.config(
            state=tk.NORMAL if self.current_page < total_pages - 1 else tk.DISABLED
        )

        # Dynamically scale page display bounding targets
        self.root.update_idletasks()
        max_w = self.preview_frame.winfo_width() - 30
        max_h = self.preview_frame.winfo_height() - 80  # Accounts for button offset

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
        """Flips forward one page inside the same document."""
        if self.doc and self.current_page < len(self.doc) - 1:
            self.current_page += 1
            self.render_page()

    def prev_page(self):
        """Flips backward one page inside the same document."""
        if self.doc and self.current_page > 0:
            self.current_page -= 1
            self.render_page()

    def rename_current(self):
        """Constructs the new file name and renames it on disk."""
        current_name = self.pdf_files[self.current_index]

        tipo_num = self.var_tipo.get()
        semestre = self.var_semestre.get()
        ano = self.var_ano.get().strip()
        tipo_doc = self.var_doc.get()
        extra_flag = "_E" if self.var_extra.get() else ""

        if not ano or not ano.isdigit():
            messagebox.showerror("Error", "Por favor ingrese un año válido de 4 dígitos.")
            return

        if tipo_num.startswith("P"):
            tipo = "P"
            num = tipo_num[1:]
        else:
            tipo = tipo_num
            num = ""

        new_name = f"{tipo}{num}_{semestre}_{ano}_{tipo_doc}{extra_flag}.pdf"

        if os.path.exists(new_name) and current_name != new_name:
            if not messagebox.askyesno(
                "Advertencia",
                f"El archivo '{new_name}' ya existe.\n¿Desea reemplazarlo?",
            ):
                return

        try:
            if self.doc:
                self.doc.close()  # Release file lock before system rename event
                self.doc = None

            os.rename(current_name, new_name)
            self.next_file()
        except Exception as e:
            messagebox.showerror(
                "Error de Archivo",
                f"No se pudo renombrar. Asegúrese de que no esté abierto en otro programa.\n\nDetalle:\n{str(e)}",
            )
            self.doc = fitz.open(current_name)
            self.render_page()

    def next_file(self):
        """Increments index counters to view next item."""
        self.current_index += 1
        self.var_extra.set(False)
        self.load_pdf_file()


if __name__ == "__main__":
    root = tk.Tk()
    app = PDFRenamerApp(root)
    root.mainloop()