import hashlib
import os
import shutil
import tkinter as tk
from tkinter import messagebox, ttk
import fitz  # PyMuPDF
from PIL import Image, ImageTk


class ExamManagerApp:

    def __init__(self, root):
        self.root = root
        self.root.title("Gestor de Exámenes PDF")
        self.root.geometry("450x350")
        self.root.resizable(False, False)

        # File tracking attributes
        self.pdf_files = []
        self.current_index = 0
        self.current_page = 0
        self.doc = None

        # Viewer tracking
        self.marked_files = set()

        # Editor tracking row widgets
        self.split_rows = []

        self.setup_launcher_ui()

    def setup_launcher_ui(self):
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)

        ttk.Label(
            main_frame,
            text="Panel de Control de Exámenes",
            font=("Arial", 14, "bold"),
            anchor="center",
        ).pack(pady=(0, 15))

        self.var_recursive = tk.BooleanVar(value=False)
        chk_recursive = ttk.Checkbutton(
            main_frame,
            text="Buscar recursivamente en subdirectorios",
            variable=self.var_recursive,
        )
        chk_recursive.pack(pady=(0, 20))

        btn_rename = ttk.Button(
            main_frame,
            text="1. Renombrar y Siguiente (Mass Rename)",
            command=lambda: self.launch_module("rename"),
        )
        btn_rename.pack(fill=tk.X, ipady=8, pady=5)

        btn_view = ttk.Button(
            main_frame,
            text="2. Visualizador & Marcador (PDF Viewer)",
            command=lambda: self.launch_module("viewer"),
        )
        btn_view.pack(fill=tk.X, ipady=8, pady=5)

        btn_edit = ttk.Button(
            main_frame,
            text="3. Editor Visual de Páginas (Split & Delete)",
            command=lambda: self.launch_module("editor"),
        )
        btn_edit.pack(fill=tk.X, ipady=8, pady=5)

    def scan_for_pdfs(self):
        self.pdf_files = []
        recursive = self.var_recursive.get()

        if recursive:
            for root_dir, _, files in os.walk("."):
                if "quarentine" in root_dir.split(os.sep):
                    continue
                for f in files:
                    if f.lower().endswith(".pdf"):
                        self.pdf_files.append(os.path.join(root_dir, f))
        else:
            self.pdf_files = [
                f for f in os.listdir(".") if f.lower().endswith(".pdf")
            ]
        self.current_index = 0

    def launch_module(self, target_module):
        self.scan_for_pdfs()

        if not self.pdf_files:
            messagebox.showinfo(
                "Sin Archivos", "No se encontraron archivos PDF en la ruta actual."
            )
            return

        self.root.withdraw()
        module_win = tk.Toplevel(self.root)
        try:
            module_win.state("zoomed")
        except tk.TclError:
            sw = module_win.winfo_screenwidth()
            sh = module_win.winfo_screenheight()
            module_win.geometry(f"{sw}x{sh}+0+0")

        if target_module == "rename":
            module_win.title("Renombrado Masivo de Exámenes")
            self.run_rename_pre_wizards(module_win)

        elif target_module == "viewer":
            module_win.title("Visualizador & Marcador de Documentos")
            module_win.protocol("WM_DELETE_WINDOW", lambda: self.close_viewer(module_win))
            self.setup_viewer_ui(module_win)
            self.load_pdf_file_ui()

        elif target_module == "editor":
            module_win.title("Editor Visual de Páginas & División PDF")
            module_win.protocol(
                "WM_DELETE_WINDOW", lambda: self.return_to_dashboard(module_win)
            )
            self.setup_editor_ui(module_win)

    def return_to_dashboard(self, current_window):
        if self.doc:
            self.doc.close()
            self.doc = None
        current_window.destroy()
        self.root.deiconify()

    # ==========================================
    # --- MODULE 1: RENAME WIZARDS & LOGIC -----
    # ==========================================

    def run_rename_pre_wizards(self, window):
        if messagebox.askyesno(
            "Corrección de Extensiones",
            "¿Desea revisar y forzar la extensión '.pdf' en todos los archivos sin formato conocido del directorio?",
        ):
            self.execute_extension_repair_script()
            self.scan_for_pdfs()

        if messagebox.askyesno(
            "Escaneo de Duplicados",
            "¿Desea ejecutar el buscador de duplicados por huella digital (Hash MD5) antes de empezar?",
        ):
            self.scan_for_duplicates(window, auto_prompt=True)

        self.setup_rename_ui(window)
        self.load_pdf_file_ui()

    def execute_extension_repair_script(self):
        repaired_count = 0
        recursive = self.var_recursive.get()

        def fix_file(file_path):
            if os.path.isfile(file_path):
                _, ext = os.path.splitext(file_path)
                if not ext and not file_path.startswith("."):
                    try:
                        os.rename(file_path, f"{file_path}.pdf")
                        return True
                    except Exception:
                        pass
            return False

        if recursive:
            for root_dir, _, files in os.walk("."):
                if "quarentine" in root_dir.split(os.sep):
                    continue
                for f in files:
                    if fix_file(os.path.join(root_dir, f)):
                        repaired_count += 1
        else:
            for f in os.listdir("."):
                if fix_file(f):
                    repaired_count += 1

        messagebox.showinfo(
            "Proceso Terminado",
            f"Se han renombrado/corregido {repaired_count} archivos sin extensión.",
        )

    def setup_rename_ui(self, win):
        win.grid_rowconfigure(0, weight=1)
        win.grid_columnconfigure(0, weight=1)

        main_frame = ttk.Frame(win, padding="15")
        main_frame.grid(row=0, column=0, sticky="nsew")
        main_frame.grid_columnconfigure(0, weight=3)
        main_frame.grid_columnconfigure(1, weight=1)
        main_frame.grid_rowconfigure(0, weight=1)

        self.preview_frame = ttk.LabelFrame(
            main_frame, text=" Vista Previa del Documento ", padding="10"
        )
        self.preview_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 10))

        self.image_label = ttk.Label(
            self.preview_frame, text="Loading preview...", anchor="center"
        )
        self.image_label.pack(fill=tk.BOTH, expand=True)

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

        control_frame = ttk.Frame(main_frame, padding="15")
        control_frame.grid(row=0, column=1, sticky="nsew")

        self.lbl_current_file = ttk.Label(
            control_frame, text="", font=("Arial", 11, "bold"), wraplength=350
        )
        self.lbl_current_file.pack(pady=(0, 20))

        ttk.Label(
            control_frame, text="Tipo de Examen:", font=("Arial", 10, "bold")
        ).pack(anchor=tk.W, pady=2)
        self.var_tipo = tk.StringVar(value="P1")
        self.cb_tipo = ttk.Combobox(
            control_frame,
            textvariable=self.var_tipo,
            values=["P1", "P2", "P3", "RP", "S"],
            state="readonly",
        )
        self.cb_tipo.pack(fill=tk.X, pady=(0, 12))

        ttk.Label(
            control_frame, text="Semestre:", font=("Arial", 10, "bold")
        ).pack(anchor=tk.W, pady=2)
        self.var_semestre = tk.StringVar(value="IS")
        self.cb_semestre = ttk.Combobox(
            control_frame, textvariable=self.var_semestre, values=["IS", "IIS"]
        )
        self.cb_semestre.pack(fill=tk.X, pady=(0, 12))

        ttk.Label(control_frame, text="Año:", font=("Arial", 10, "bold")).pack(
            anchor=tk.W, pady=2
        )
        self.var_ano = tk.StringVar(value="2026")
        self.ent_ano = ttk.Entry(control_frame, textvariable=self.var_ano)
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

        btn_rename = ttk.Button(
            control_frame, text="Renombrar y Siguiente", command=self.rename_current
        )
        btn_rename.pack(fill=tk.X, ipady=6, pady=3)

        btn_skip = ttk.Button(
            control_frame, text="Saltar Archivo", command=self.next_file
        )
        btn_skip.pack(fill=tk.X, ipady=6, pady=3)

        btn_quarantine = ttk.Button(
            control_frame, text="⚠️ Mover a Cuarentena", command=self.quarantine_current
        )
        btn_quarantine.pack(fill=tk.X, ipady=6, pady=(3, 20))

        bottom_tools = ttk.Frame(control_frame)
        bottom_tools.pack(side=tk.BOTTOM, fill=tk.X)

        btn_scan_dup = ttk.Button(
            bottom_tools,
            text="🔍 Escanear Duplicados",
            command=lambda: self.scan_for_duplicates(win),
        )
        btn_scan_dup.pack(fill=tk.X, ipady=6, pady=(10, 0))

        btn_back = ttk.Button(
            bottom_tools,
            text="Volver al Menú Principal",
            command=lambda: self.return_to_dashboard(win),
        )
        btn_back.pack(fill=tk.X, ipady=4, pady=5)

        self.lbl_progress = ttk.Label(
            bottom_tools, text="", font=("Arial", 10, "italic")
        )
        self.lbl_progress.pack(pady=5)

        win.bind("<Left>", lambda event: self.prev_page())
        win.bind("<Right>", lambda event: self.next_page())

    # ==========================================
    # --- MODULE 2: VIEWER & MARKER CORES -----
    # ==========================================

    def setup_viewer_ui(self, win):
        win.grid_rowconfigure(0, weight=1)
        win.grid_columnconfigure(0, weight=1)

        main_frame = ttk.Frame(win, padding="15")
        main_frame.grid(row=0, column=0, sticky="nsew")
        main_frame.grid_columnconfigure(0, weight=3)
        main_frame.grid_columnconfigure(1, weight=1)
        main_frame.grid_rowconfigure(0, weight=1)

        self.preview_frame = ttk.LabelFrame(
            main_frame, text=" Visualizador Completo de PDFs ", padding="10"
        )
        self.preview_frame.grid(row=0, column=0, sticky="nsew", padx=(0, 10))

        self.image_label = ttk.Label(
            self.preview_frame, text="Loading preview...", anchor="center"
        )
        self.image_label.pack(fill=tk.BOTH, expand=True)

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

        control_frame = ttk.Frame(main_frame, padding="15")
        control_frame.grid(row=0, column=1, sticky="nsew")

        self.lbl_current_file = ttk.Label(
            control_frame, text="", font=("Arial", 11, "bold"), wraplength=350
        )
        self.lbl_current_file.pack(pady=(0, 25))

        self.var_marked = tk.BooleanVar(value=False)
        self.chk_marked = ttk.Checkbutton(
            control_frame,
            text="📌 Marcar este documento PDF",
            variable=self.var_marked,
            command=self.toggle_file_mark,
        )
        self.chk_marked.pack(anchor=tk.W, pady=20)

        btn_next_f = ttk.Button(
            control_frame, text="Siguiente Archivo ▶", command=self.next_file
        )
        btn_next_f.pack(fill=tk.X, ipady=8, pady=5)

        btn_prev_f = ttk.Button(
            control_frame, text="◀ Archivo Anterior", command=self.prev_file
        )
        btn_prev_f.pack(fill=tk.X, ipady=8, pady=5)

        bottom_tools = ttk.Frame(control_frame)
        bottom_tools.pack(side=tk.BOTTOM, fill=tk.X)

        btn_finish = ttk.Button(
            bottom_tools,
            text="Guardar Marcas y Salir",
            command=lambda: self.close_viewer(win),
        )
        btn_finish.pack(fill=tk.X, ipady=6, pady=5)

        self.lbl_progress = ttk.Label(
            bottom_tools, text="", font=("Arial", 10, "italic")
        )
        self.lbl_progress.pack(pady=5)

        win.bind("<Left>", lambda event: self.prev_page())
        win.bind("<Right>", lambda event: self.next_page())

    def toggle_file_mark(self):
        current_file = self.pdf_files[self.current_index]
        abs_path = os.path.abspath(current_file)

        if self.var_marked.get():
            self.marked_files.add(abs_path)
        else:
            self.marked_files.discard(abs_path)

    def close_viewer(self, window):
        try:
            with open("marked_pdfs.txt", "w", encoding="utf-8") as f:
                for path in sorted(list(self.marked_files)):
                    f.write(f"{path}\n")
            messagebox.showinfo(
                "Marcas Guardadas",
                f"Se guardó la lista de marcas absolutas en:\n{os.path.abspath('marked_pdfs.txt')}",
            )
        except Exception as e:
            messagebox.showerror(
                "Error al Guardar", f"No se pudo escribir el archivo .txt:\n{str(e)}"
            )
        self.return_to_dashboard(window)

    # ==========================================
    # --- MODULE 3: VISUAL EDITOR & SPLITTER ---
    # ==========================================

    def setup_editor_ui(self, win):
        win.grid_rowconfigure(0, weight=1)
        win.grid_columnconfigure(0, weight=1)

        main_frame = ttk.Frame(win, padding="10")
        main_frame.grid(row=0, column=0, sticky="nsew")

        # 3 Column Setup: File List (15%), Live Preview (55%), Splitting Tools (30%)
        main_frame.grid_columnconfigure(0, weight=1)
        main_frame.grid_columnconfigure(1, weight=3)
        main_frame.grid_columnconfigure(2, weight=2)
        main_frame.grid_rowconfigure(0, weight=1)

        # COLUMN 0: FILE SELECTION LIST
        list_pane = ttk.LabelFrame(main_frame, text=" Archivos ", padding="5")
        list_pane.grid(row=0, column=0, sticky="nsew", padx=(0, 5))
        self.edit_listbox = tk.Listbox(list_pane, font=("Arial", 10))
        self.edit_listbox.pack(fill=tk.BOTH, expand=True)
        self.edit_listbox.bind("<<ListboxSelect>>", self.on_editor_file_selected)

        for f in self.pdf_files:
            self.edit_listbox.insert(tk.END, os.path.basename(f))

        # COLUMN 1: LIVE PDF CANVAS PREVIEW
        self.preview_frame = ttk.LabelFrame(
            main_frame, text=" Vista Previa Integrada ", padding="5"
        )
        self.preview_frame.grid(row=0, column=1, sticky="nsew", padx=(0, 5))

        self.image_label = ttk.Label(
            self.preview_frame, text="Seleccione un archivo PDF...", anchor="center"
        )
        self.image_label.pack(fill=tk.BOTH, expand=True)

        page_nav_frame = ttk.Frame(self.preview_frame)
        page_nav_frame.pack(side=tk.BOTTOM, fill=tk.X, pady=2)

        center_nav = ttk.Frame(page_nav_frame)
        center_nav.pack(anchor=tk.CENTER)

        self.btn_prev_page = ttk.Button(
            center_nav, text="◀", width=5, command=self.prev_page
        )
        self.btn_prev_page.pack(side=tk.LEFT, padx=5)

        self.lbl_page_counter = ttk.Label(
            center_nav, text="Página 0 de 0", font=("Arial", 9, "bold")
        )
        self.lbl_page_counter.pack(side=tk.LEFT, padx=10)

        self.btn_next_page = ttk.Button(
            center_nav, text="▶", width=5, command=self.next_page
        )
        self.btn_next_page.pack(side=tk.LEFT, padx=5)

        # COLUMN 2: TOOLS CONTROL SIDE PANEL
        right_pane = ttk.Frame(main_frame, padding="10")
        right_pane.grid(row=0, column=2, sticky="nsew")
        right_pane.grid_rowconfigure(1, weight=1)  # Dynamic splits container expands

        self.lbl_editor_file = ttk.Label(
            right_pane, text="Ningún archivo seleccionado", font=("Arial", 10, "bold"), wraplength=250
        )
        self.lbl_editor_file.pack(anchor=tk.W, pady=(0, 10))

        # TOOL ACTION 1: DELETE PAGE BLOCK
        del_frame = ttk.LabelFrame(right_pane, text=" Eliminar Páginas ", padding="8")
        del_frame.pack(fill=tk.X, pady=(0, 15))

        self.var_delete_pages = tk.StringVar()
        ttk.Entry(del_frame, textvariable=self.var_delete_pages).pack(
            fill=tk.X, pady=2
        )
        ttk.Button(
            del_frame, text="Eliminar Páginas (Ej: 1,3)", command=self.execute_pdf_delete
        ).pack(fill=tk.X, pady=2)

        # TOOL ACTION 2: MULTI-SPLIT CREATOR BLOCK
        split_master_frame = ttk.LabelFrame(
            right_pane, text=" Configurar División (Multi-Split) ", padding="8"
        )
        split_master_frame.pack(fill=tk.BOTH, expand=True)

        # Scrollable area to handle unlimited file split segments cleanly
        canvas_container = ttk.Frame(split_master_frame)
        canvas_container.pack(fill=tk.BOTH, expand=True, pady=5)

        self.split_scroll_canvas = tk.Canvas(canvas_container, borderwidth=0, highlightthickness=0)
        scrollbar = ttk.Scrollbar(
            canvas_container, orient=tk.VERTICAL, command=self.split_scroll_canvas.yview
        )
        self.scrollable_split_frame = ttk.Frame(self.split_scroll_canvas)

        self.scrollable_split_frame.bind(
            "<Configure>",
            lambda e: self.split_scroll_canvas.configure(
                scrollregion=self.split_scroll_canvas.bbox("all")
            ),
        )
        self.split_scroll_canvas.create_window(
            (0, 0), window=self.scrollable_split_frame, anchor="nw"
        )
        self.split_scroll_canvas.configure(yscrollcommand=scrollbar.set)

        self.split_scroll_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        # Build structural row toolbar headers
        row_actions = ttk.Frame(split_master_frame)
        row_actions.pack(fill=tk.X, pady=5)

        ttk.Button(
            row_actions, text="➕ Añadir Corte", command=self.add_split_row_widget
        ).pack(side=tk.LEFT, padx=2)
        ttk.Button(
            row_actions, text="✂️ Ejecutar División", command=self.execute_multi_split
        ).pack(side=tk.RIGHT, padx=2)

        # Return to menu button pinned to absolute bottom right corner view
        ttk.Button(
            right_pane,
            text="Volver al Menú Principal",
            command=lambda: self.return_to_dashboard(win),
        ).pack(side=tk.BOTTOM, fill=tk.X, pady=(10, 0))

        # Add two default split rows right away for instant feedback
        self.split_rows = []
        self.add_split_row_widget()
        self.add_split_row_widget()

        win.bind("<Left>", lambda event: self.prev_page())
        win.bind("<Right>", lambda event: self.next_page())

    def add_split_row_widget(self):
        """Appends a new layout settings configuration row into the dynamic split window array list."""
        row_index = len(self.split_rows) + 1
        row_frame = ttk.Frame(self.scrollable_split_frame, padding=2)
        row_frame.pack(fill=tk.X, expand=True)

        ttk.Label(row_frame, text=f"Doc {row_index}: Rango:").pack(side=tk.LEFT, padx=2)

        var_range = tk.StringVar()
        entry = ttk.Entry(row_frame, textvariable=var_range, width=12)
        entry.pack(side=tk.LEFT, padx=2)

        def remove_self():
            if len(self.split_rows) <= 1:
                return  # Always keep at least one target output rule
            row_frame.destroy()
            self.split_rows.remove((row_frame, var_range))
            self.reindex_split_labels()

        btn_del = ttk.Button(row_frame, text="❌", width=3, command=remove_self)
        btn_del.pack(side=tk.LEFT, padx=2)

        self.split_rows.append((row_frame, var_range))

    def reindex_split_labels(self):
        """Updates numeric descriptive index text values inside layout boxes sequentially after a drop."""
        for idx, (frame, _) in enumerate(self.split_rows):
            for child in frame.winfo_children():
                if isinstance(child, ttk.Label):
                    child.config(text=f"Doc {idx + 1}: Rango:")

    def on_editor_file_selected(self, event):
        """Intercepts clicks on the file tree listbox to open documents into memory views."""
        selection = self.edit_listbox.curselection()
        if not selection:
            return

        selected_short_name = self.edit_listbox.get(selection[0])
        # Find match within our system scanned array references
        full_path = next(
            (p for p in self.pdf_files if os.path.basename(p) == selected_short_name),
            None,
        )

        if full_path:
            # Sync tracker references to matching system arrays context points
            self.current_index = self.pdf_files.index(full_path)
            self.lbl_editor_file.config(text=f"Archivo: {selected_short_name}")

            try:
                if self.doc:
                    self.doc.close()
                self.doc = fitz.open(full_path)
                self.current_page = 0
                self.render_page_canvas()
            except Exception as e:
                self.image_label.config(
                    image="", text=f"Error al abrir archivo:\n{str(e)}"
                )

    def execute_pdf_delete(self):
        if not self.doc or self.current_index >= len(self.pdf_files):
            messagebox.showwarning("Selección", "Primero seleccione un archivo de la lista.")
            return

        target_path = self.pdf_files[self.current_index]
        raw_input = self.var_delete_pages.get().strip()

        if not raw_input:
            messagebox.showerror("Campos vacíos", "Indique las páginas a borrar.")
            return

        try:
            target_pages = [
                int(p.strip()) - 1
                for p in raw_input.split(",")
                if p.strip().isdigit()
            ]
            if not target_pages:
                raise ValueError()
        except ValueError:
            messagebox.showerror("Error", "Use números válidos separados por comas.")
            return

        total = len(self.doc)
        invalid_pages = [p + 1 for p in target_pages if p < 0 or p >= total]
        if invalid_pages:
            messagebox.showerror(
                "Error", f"Páginas fuera de rango: {invalid_pages}. Total: {total}"
            )
            return

        if messagebox.askyesno(
            "Confirmar", f"¿Eliminar {len(target_pages)} páginas del archivo actual?"
        ):
            try:
                self.doc.close()  # Unlock file handle before rewrite tasks
                doc = fitz.open(target_path)

                for p in sorted(target_pages, reverse=True):
                    doc.delete_page(p)

                base, ext = os.path.splitext(target_path)
                output_path = f"{base}_modificado{ext}"
                doc.save(output_path)
                doc.close()

                messagebox.showinfo(
                    "Éxito", f"Archivo modificado creado:\n{os.path.basename(output_path)}"
                )
                # Re-lock workspace view context safely
                self.doc = fitz.open(target_path)
                self.render_page_canvas()
            except Exception as e:
                messagebox.showerror("Error", f"No se pudo completar la operación:\n{str(e)}")

    def execute_multi_split(self):
        """Processes dynamic input strings to split a document into multiple targets."""
        if not self.doc or self.current_index >= len(self.pdf_files):
            messagebox.showwarning("Selección", "Primero seleccione un archivo de la lista.")
            return

        target_path = self.pdf_files[self.current_index]
        total_pages = len(self.doc)

        parsed_ranges = []
        for idx, (_, var_range) in enumerate(self.split_rows):
            raw_val = var_range.get().strip()
            if not raw_val:
                continue

            if "-" not in raw_val:
                messagebox.showerror(
                    "Error de Formato",
                    f"El rango '{raw_val}' en Doc {idx+1} debe usar guion. Ej: 1-3",
                )
                return

            try:
                parts = raw_val.split("-")
                start = int(parts[0].strip()) - 1
                end = int(parts[1].strip()) - 1
                if start < 0 or end < start or end >= total_pages:
                    raise ValueError()
                parsed_ranges.append((start, end))
            except ValueError:
                messagebox.showerror(
                    "Límites Inválidos",
                    f"Rango inválido '{raw_val}' en Doc {idx+1}. El documento tiene {total_pages} páginas.",
                )
                return

        if not parsed_ranges:
            messagebox.showerror("Campos vacíos", "Configure al menos un rango de corte.")
            return

        try:
            base, ext = os.path.splitext(target_path)
            # Safe close current file viewer to release OS execution hooks
            self.doc.close()

            source_doc = fitz.open(target_path)

            for idx, (start, end) in enumerate(parsed_ranges):
                sub_doc = fitz.open()
                sub_doc.insert_pdf(source_doc, from_page=start, to_page=end)
                output_name = f"{base}_parte_{idx+1}{ext}"
                sub_doc.save(output_name)
                sub_doc.close()

            source_doc.close()
            messagebox.showinfo(
                "División Exitosa",
                f"Se han generado {len(parsed_ranges)} subarchivos PDF correctamente.",
            )

            # Re-engage view loop handles safely
            self.doc = fitz.open(target_path)
            self.render_page_canvas()
        except Exception as e:
            messagebox.showerror("Error del Motor", f"Error crítico al dividir:\n{str(e)}")

    # ==========================================
    # --- SHARED RENDER ENGINE GRAPHICS --------
    # ==========================================

    def load_pdf_file_ui(self):
        if self.current_index >= len(self.pdf_files):
            if self.doc:
                self.doc.close()
            messagebox.showinfo("¡Listo!", "Se han procesado todos los archivos de la lista.")
            return

        filename = self.pdf_files[self.current_index]
        self.lbl_current_file.config(text=f"Archivo:\n{os.path.basename(filename)}")
        self.lbl_progress.config(
            text=f"Progreso: {self.current_index + 1} / {len(self.pdf_files)}"
        )

        if hasattr(self, "var_marked"):
            self.var_marked.set(os.path.abspath(filename) in self.marked_files)

        try:
            if self.doc:
                self.doc.close()
            self.doc = fitz.open(filename)
            self.current_page = 0
            self.render_page_canvas()
        except Exception as e:
            self.image_label.config(
                image="", text=f"Error al abrir el archivo:\n{str(e)}"
            )

    def render_page_canvas(self):
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
            self.render_page_canvas()

    def prev_page(self):
        if self.doc and self.current_page > 0:
            self.current_page -= 1
            self.render_page_canvas()

    def next_file(self):
        self.current_index += 1
        if hasattr(self, "var_extra"):
            self.var_extra.set(False)
        self.load_pdf_file_ui()

    def prev_file(self):
        if self.current_index > 0:
            self.current_index -= 1
            self.load_pdf_file_ui()

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

        dir_name = os.path.dirname(current_name)
        new_base_name = f"{tipo}{num}_{semestre}_{ano}_{tipo_doc}{extra_flag}.pdf"
        new_name = (
            os.path.join(dir_name, new_base_name) if dir_name else new_base_name
        )

        if os.path.exists(new_name) and current_name != new_name:
            if not messagebox.askyesno(
                "Advertencia",
                f"El archivo '{new_base_name}' ya existe.\n¿Desea reemplazarlo?",
            ):
                return

        try:
            if self.doc:
                self.doc.close()
                self.doc = None
            os.rename(current_name, new_name)
            self.pdf_files.pop(self.current_index)
            self.load_pdf_file_ui()
        except Exception as e:
            messagebox.showerror("Error de Archivo", f"No se pudo renombrar:\n{str(e)}")
            self.doc = fitz.open(current_name)
            self.render_page_canvas()

    def quarantine_current(self):
        current_name = self.pdf_files[self.current_index]
        folder_name = "quarentine"

        if not os.path.exists(folder_name):
            os.makedirs(folder_name)

        try:
            if self.doc:
                self.doc.close()
                self.doc = None

            dest_path = os.path.join(folder_name, os.path.basename(current_name))
            shutil.move(current_name, dest_path)

            self.pdf_files.pop(self.current_index)
            if hasattr(self, "var_extra"):
                self.var_extra.set(False)
            self.load_pdf_file_ui()
        except Exception as e:
            messagebox.showerror(
                "Error de Aislamiento", f"No se pudo mover a cuarentena:\n{str(e)}"
            )
            self.doc = fitz.open(current_name)
            self.render_page_canvas()

    def scan_for_duplicates(self, parent_window, auto_prompt=False):
        hashes = {}
        duplicates = []

        for filename in self.pdf_files:
            if not os.path.exists(filename):
                continue
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
            if not auto_prompt:
                messagebox.showinfo("Escaneo Terminado", "No se hallaron archivos duplicados.")
            return

        self.show_duplicates_window(parent_window, duplicates)

    def show_duplicates_window(self, parent_window, duplicates):
        dup_win = tk.Toplevel(parent_window)
        dup_win.title("Duplicados Encontrados")
        dup_win.geometry("650x400")
        dup_win.grab_set()

        ttk.Label(
            dup_win,
            text="Se detectaron los siguientes duplicados exactos:",
            font=("Arial", 11, "bold"),
        ).pack(pady=10)

        frame = ttk.Frame(dup_win)
        frame.pack(fill=tk.BOTH, expand=True, padx=15, pady=5)

        tree = ttk.Treeview(
            frame, columns=("Duplicado", "Original"), show="headings", selectmode="browse"
        )
        tree.heading("Duplicado", text="Archivo Duplicado")
        tree.heading("Original", text="Original Conservado")
        tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        scrollbar = ttk.Scrollbar(frame, orient=tk.VERTICAL, command=tree.yview)
        tree.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        for dup, orig in duplicates:
            tree.insert("", tk.END, values=(os.path.basename(dup), os.path.basename(orig)))

        def delete_selected():
            selected_item = tree.focus()
            if not selected_item:
                return

            values = tree.item(selected_item, "values")
            short_dup = values[0]

            full_dup_path = next((p for p in self.pdf_files if os.path.basename(p) == short_dup), None)

            if full_dup_path and messagebox.askyesno(
                "Eliminar", f"¿Eliminar definitivamente '{short_dup}'?"
            ):
                try:
                    if (
                        self.current_index < len(self.pdf_files)
                        and self.pdf_files[self.current_index] == full_dup_path
                    ):
                        if self.doc:
                            self.doc.close()
                            self.doc = None

                    os.remove(full_dup_path)
                    tree.delete(selected_item)

                    if full_dup_path in self.pdf_files:
                        self.pdf_files.remove(full_dup_path)

                    if self.current_index >= len(self.pdf_files):
                        self.current_index = max(0, len(self.pdf_files) - 1)

                    if hasattr(self, "lbl_page_counter"):
                        self.load_pdf_file_ui()
                except Exception as e:
                    messagebox.showerror("Error", f"No se pudo eliminar:\n{str(e)}")

        ttk.Button(
            dup_win, text="Eliminar Duplicado Seleccionado", command=delete_selected
        ).pack(pady=15, ipady=5)


if __name__ == "__main__":
    root = tk.Tk()
    app = ExamManagerApp(root)
    root.mainloop()
