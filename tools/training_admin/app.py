from __future__ import annotations

import json
import shutil
import subprocess
import sys
import threading
import webbrowser
from pathlib import Path
from tkinter import BOTH, END, LEFT, RIGHT, X, Y, filedialog, messagebox, ttk
from typing import Any, Callable
import tkinter as tk

try:
    import customtkinter as ctk
except Exception:  # pragma: no cover - optional dependency
    ctk = None

if __package__ in (None, ""):
    sys.path.append(str(Path(__file__).resolve().parent))
    from generator import generate
    from storage import ROOT, create_backup, load_all, save_all
    from validators import URL_RE, validate_data
else:  # pragma: no cover
    from .generator import generate
    from .storage import ROOT, create_backup, load_all, save_all
    from .validators import URL_RE, validate_data


CATEGORIES = ["puxar", "empurrar", "inferior", "gluteo", "superior", "core", "cardio", "mobilidade"]
KINDS = ["composto", "isolador", "cardio", "mobilidade"]
EQUIPMENT_TYPES = ["maquina", "cabo", "acessorio", "peso_livre", "cardio", "outro"]
DAY_NAMES = ["Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo"]


def json_clone(value: Any) -> Any:
    return json.loads(json.dumps(value, ensure_ascii=False))


def item_label(item: dict[str, Any]) -> str:
    return str(item.get("name") or item.get("title") or item.get("exerciseId") or item.get("id") or "<sem id>")


def public_path(path: str) -> Path:
    return ROOT / "frontend" / "public" / path.lstrip("/")


def stable_id(label: str, fallback: str) -> str:
    chars = []
    for char in label.strip().lower():
        if char.isalnum():
            chars.append(char)
        elif char in {" ", "-", "/", "_"}:
            chars.append("_")
    value = "".join(chars).strip("_")
    while "__" in value:
        value = value.replace("__", "_")
    return value or fallback


def split_lines(value: str) -> list[str]:
    return [line.strip() for line in value.splitlines() if line.strip()]


class ScrollFrame(ttk.Frame):
    def __init__(self, master: tk.Widget):
        super().__init__(master)
        self.canvas = tk.Canvas(self, highlightthickness=0, bg="#15111d")
        self.scrollbar = ttk.Scrollbar(self, orient="vertical", command=self.canvas.yview)
        self.inner = ttk.Frame(self.canvas)
        self.window_id = self.canvas.create_window((0, 0), window=self.inner, anchor="nw")
        self.inner.bind("<Configure>", lambda _event: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        self.canvas.bind("<Configure>", lambda event: self.canvas.itemconfigure(self.window_id, width=event.width))
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        self.canvas.pack(side=LEFT, fill=BOTH, expand=True)
        self.scrollbar.pack(side=RIGHT, fill=Y)


class MultiSelectBox(ttk.Frame):
    def __init__(self, master: tk.Widget, height: int = 6):
        super().__init__(master)
        self.listbox = tk.Listbox(self, selectmode="multiple", height=height, exportselection=False)
        self.scrollbar = ttk.Scrollbar(self, orient="vertical", command=self.listbox.yview)
        self.listbox.configure(yscrollcommand=self.scrollbar.set)
        self.listbox.pack(side=LEFT, fill=BOTH, expand=True)
        self.scrollbar.pack(side=RIGHT, fill=Y)
        self.ids: list[str] = []

    def set_options(self, options: list[tuple[str, str]], selected: list[str] | None = None) -> None:
        selected_set = set(selected or [])
        self.ids = [option_id for option_id, _label in options]
        self.listbox.delete(0, END)
        for index, (option_id, label) in enumerate(options):
            self.listbox.insert(END, f"{option_id} - {label}")
            if option_id in selected_set:
                self.listbox.selection_set(index)

    def get_selected(self) -> list[str]:
        return [self.ids[index] for index in self.listbox.curselection()]


class ListEditor(ttk.Frame):
    def __init__(self, master: tk.Widget, height: int = 5):
        super().__init__(master)
        self.text = tk.Text(self, height=height, wrap="word")
        self.text.pack(fill=BOTH, expand=True)

    def set(self, values: list[str] | str | None) -> None:
        if isinstance(values, list):
            content = "\n".join(str(value) for value in values)
        else:
            content = str(values or "")
        self.text.delete("1.0", END)
        self.text.insert("1.0", content)

    def get_list(self) -> list[str]:
        return split_lines(self.text.get("1.0", END))

    def get_text(self) -> str:
        return self.text.get("1.0", END).strip()


class SidebarFormTab(ttk.Frame):
    key = ""
    title = ""
    id_field = "id"

    def __init__(self, master: tk.Widget, app: "TrainingAdminApp"):
        super().__init__(master)
        self.app = app
        self.selected_index: int | None = None
        self.filtered_indexes: list[int] = []
        self.search_var = tk.StringVar()
        self.category_filter = tk.StringVar(value="todos")
        self.available_filter = tk.StringVar(value="todos")
        self.vars: dict[str, tk.Variable] = {}
        self.texts: dict[str, ListEditor] = {}
        self.multi: dict[str, MultiSelectBox] = {}
        self.json_editor: tk.Text | None = None
        self.preview_image: tk.PhotoImage | None = None
        self.build()
        self.refresh_list()

    @property
    def items(self) -> list[dict[str, Any]]:
        return self.app.data[self.key]

    def build(self) -> None:
        self.columnconfigure(1, weight=1)
        self.rowconfigure(0, weight=1)

        sidebar = ttk.Frame(self, padding=12)
        sidebar.grid(row=0, column=0, sticky="nsw")
        ttk.Label(sidebar, text=self.title, font=("Segoe UI", 15, "bold")).pack(anchor="w", pady=(0, 8))

        self.search_entry = ttk.Entry(sidebar, textvariable=self.search_var)
        self.search_entry.pack(fill=X, pady=(0, 8))
        self.search_entry.bind("<KeyRelease>", lambda _event: self.refresh_list())

        self.build_filters(sidebar)

        self.listbox = tk.Listbox(sidebar, width=36, height=24, exportselection=False)
        self.listbox.pack(fill=BOTH, expand=True)
        self.listbox.bind("<<ListboxSelect>>", self.on_select)

        buttons = ttk.Frame(sidebar)
        buttons.pack(fill=X, pady=10)
        ttk.Button(buttons, text="Novo", command=self.new_item).pack(side=LEFT, expand=True, fill=X)
        ttk.Button(buttons, text="Duplicar", command=self.duplicate_item).pack(side=LEFT, expand=True, fill=X, padx=4)
        ttk.Button(buttons, text="Remover", command=self.delete_item).pack(side=LEFT, expand=True, fill=X)

        notebook = ttk.Notebook(self)
        notebook.grid(row=0, column=1, sticky="nsew", padx=(0, 12), pady=12)

        form_shell = ScrollFrame(notebook)
        notebook.add(form_shell, text="Formulario")
        self.form = form_shell.inner
        self.form.columnconfigure(1, weight=1)
        self.build_form(self.form)

        advanced = ttk.Frame(notebook, padding=12)
        notebook.add(advanced, text="Avancado / JSON")
        ttk.Label(
            advanced,
            text="Edite manualmente apenas se souber o que esta fazendo.",
            foreground="#d97706",
        ).pack(anchor="w")
        self.json_editor = tk.Text(advanced, wrap="word", height=26)
        self.json_editor.pack(fill=BOTH, expand=True, pady=8)
        ttk.Button(advanced, text="Aplicar JSON ao formulario", command=self.apply_json).pack(anchor="e")

        footer = ttk.Frame(self, padding=(12, 0, 12, 12))
        footer.grid(row=1, column=0, columnspan=2, sticky="ew")
        ttk.Button(footer, text="Salvar item", command=self.save_current).pack(side=RIGHT)
        self.validation_label = ttk.Label(footer, text="Selecione um item.", foreground="#9ca3af")
        self.validation_label.pack(side=LEFT)

    def build_filters(self, parent: ttk.Frame) -> None:
        _ = parent

    def build_form(self, parent: ttk.Frame) -> None:
        raise NotImplementedError

    def default_item(self) -> dict[str, Any]:
        return {self.id_field: "novo_item"}

    def label_for_list(self, item: dict[str, Any], index: int) -> str:
        return f"{index + 1}. {item_label(item)}"

    def filtered_items(self) -> list[tuple[int, dict[str, Any]]]:
        query = self.search_var.get().strip().lower()
        rows = list(enumerate(self.items))
        if query:
            rows = [
                (index, item)
                for index, item in rows
                if query in json.dumps(item, ensure_ascii=False).lower()
            ]
        return rows

    def refresh_list(self) -> None:
        selected_key = self.current_item().get(self.id_field) if self.current_item() else None
        rows = self.filtered_items()
        self.filtered_indexes = [index for index, _item in rows]
        self.listbox.delete(0, END)
        for visible_index, (source_index, item) in enumerate(rows):
            self.listbox.insert(END, self.label_for_list(item, source_index))
            if selected_key and item.get(self.id_field) == selected_key:
                self.listbox.selection_set(visible_index)

    def refresh_reference_options(self) -> None:
        pass

    def current_item(self) -> dict[str, Any] | None:
        if self.selected_index is None or self.selected_index >= len(self.items):
            return None
        return self.items[self.selected_index]

    def on_select(self, _event: tk.Event | None = None) -> None:
        selection = self.listbox.curselection()
        if not selection:
            return
        self.save_current(silent=True)
        self.selected_index = self.filtered_indexes[selection[0]]
        self.load_item(self.items[self.selected_index])

    def load_item(self, item: dict[str, Any]) -> None:
        self.refresh_reference_options()
        for field, var in self.vars.items():
            value = item.get(field, "")
            if isinstance(var, tk.BooleanVar):
                var.set(bool(value))
            else:
                var.set("" if value is None else str(value))
        for field, editor in self.texts.items():
            editor.set(item.get(field))
        for field, widget in self.multi.items():
            widget.set_options(self.options_for(field), item.get(field, []) or [])
        if self.json_editor:
            self.json_editor.delete("1.0", END)
            self.json_editor.insert("1.0", json.dumps(item, ensure_ascii=False, indent=2))
        self.update_preview(item)
        self.validate_current_item()

    def collect_item(self) -> dict[str, Any]:
        item = json_clone(self.current_item() or self.default_item())
        for field, var in self.vars.items():
            if isinstance(var, tk.BooleanVar):
                item[field] = bool(var.get())
                continue
            raw = str(var.get()).strip()
            if field == "rest":
                item[field] = int(float(raw or 0))
            elif field == "met":
                item[field] = float(raw) if raw else None
            elif raw:
                item[field] = raw
            else:
                item[field] = "" if field not in {"met"} else None
        for field, editor in self.texts.items():
            if field in {"tips", "illustrations"}:
                item[field] = editor.get_list()
            else:
                item[field] = editor.get_text()
        for field, widget in self.multi.items():
            item[field] = widget.get_selected()
        return item

    def save_current(self, silent: bool = False) -> bool:
        if self.selected_index is None:
            return True
        try:
            item = self.collect_item()
        except ValueError as exc:
            if not silent:
                self.validation_label.configure(text=f"Erro: {exc}", foreground="#ef4444")
            return False
        self.items[self.selected_index] = item
        self.app.mark_dirty()
        self.refresh_list()
        self.load_item(item)
        return True

    def new_item(self) -> None:
        item = self.default_item()
        self.items.append(item)
        self.selected_index = len(self.items) - 1
        self.app.mark_dirty()
        self.refresh_list()
        self.load_item(item)

    def duplicate_item(self) -> None:
        item = self.current_item()
        if not item:
            return
        copy = json_clone(item)
        key = self.id_field
        copy[key] = f"{copy.get(key, 'item')}_copia"
        self.items.append(copy)
        self.selected_index = len(self.items) - 1
        self.app.mark_dirty()
        self.refresh_list()
        self.load_item(copy)

    def delete_item(self) -> None:
        if self.selected_index is None:
            return
        item = self.items[self.selected_index]
        if not messagebox.askyesno("Remover", f"Remover {item_label(item)}?"):
            return
        del self.items[self.selected_index]
        self.selected_index = None
        self.app.mark_dirty()
        self.refresh_list()
        self.validation_label.configure(text="Item removido.", foreground="#d97706")

    def apply_json(self) -> None:
        if self.selected_index is None or not self.json_editor:
            return
        try:
            item = json.loads(self.json_editor.get("1.0", END))
        except json.JSONDecodeError as exc:
            messagebox.showerror("JSON invalido", str(exc))
            return
        self.items[self.selected_index] = item
        self.app.mark_dirty()
        self.refresh_list()
        self.load_item(item)

    def validate_current_item(self) -> None:
        item = self.current_item()
        if not item:
            return
        errors = self.item_errors(item)
        warnings = self.item_warnings(item)
        if errors:
            message = "Erros: " + " | ".join(errors[:4])
            color = "#ef4444"
        elif warnings:
            message = "Avisos: " + " | ".join(warnings[:4])
            color = "#d97706"
        else:
            message = "OK - item pronto para gerar."
            color = "#22c55e"
        self.validation_label.configure(text=message, foreground=color)
        self.app.show_item_validation(errors, warnings)

    def item_errors(self, item: dict[str, Any]) -> list[str]:
        _ = item
        return []

    def item_warnings(self, item: dict[str, Any]) -> list[str]:
        _ = item
        return []

    def update_preview(self, item: dict[str, Any]) -> None:
        _ = item

    def options_for(self, field: str) -> list[tuple[str, str]]:
        _ = field
        return []

    def add_row(self, parent: ttk.Frame, row: int, label: str, widget: tk.Widget) -> None:
        ttk.Label(parent, text=label).grid(row=row, column=0, sticky="nw", padx=8, pady=6)
        widget.grid(row=row, column=1, sticky="ew", padx=8, pady=6)

    def entry(self, parent: ttk.Frame, field: str, label: str, row: int) -> None:
        var = tk.StringVar()
        widget = ttk.Entry(parent, textvariable=var)
        self.vars[field] = var
        self.add_row(parent, row, label, widget)

    def combo(self, parent: ttk.Frame, field: str, label: str, values: list[str], row: int) -> None:
        var = tk.StringVar()
        widget = ttk.Combobox(parent, textvariable=var, values=values, state="readonly")
        self.vars[field] = var
        self.add_row(parent, row, label, widget)

    def checkbox(self, parent: ttk.Frame, field: str, label: str, row: int) -> None:
        var = tk.BooleanVar()
        widget = ttk.Checkbutton(parent, text=label, variable=var)
        self.vars[field] = var
        widget.grid(row=row, column=1, sticky="w", padx=8, pady=6)

    def text(self, parent: ttk.Frame, field: str, label: str, row: int, height: int = 4) -> None:
        editor = ListEditor(parent, height=height)
        self.texts[field] = editor
        self.add_row(parent, row, label, editor)

    def multi_select(self, parent: ttk.Frame, field: str, label: str, row: int, height: int = 6) -> None:
        widget = MultiSelectBox(parent, height=height)
        self.multi[field] = widget
        self.add_row(parent, row, label, widget)


class ExerciseTab(SidebarFormTab):
    key = "exercises"
    title = "Exercicios"

    def build_filters(self, parent: ttk.Frame) -> None:
        ttk.Label(parent, text="Categoria").pack(anchor="w")
        category = ttk.Combobox(parent, textvariable=self.category_filter, values=["todos", *CATEGORIES], state="readonly")
        category.pack(fill=X, pady=(0, 8))
        category.bind("<<ComboboxSelected>>", lambda _event: self.refresh_list())
        ttk.Label(parent, text="Disponibilidade").pack(anchor="w")
        availability = ttk.Combobox(
            parent,
            textvariable=self.available_filter,
            values=["todos", "disponiveis", "indisponiveis"],
            state="readonly",
        )
        availability.pack(fill=X, pady=(0, 8))
        availability.bind("<<ComboboxSelected>>", lambda _event: self.refresh_list())

    def build_form(self, parent: ttk.Frame) -> None:
        self.entry(parent, "id", "ID", 0)
        self.entry(parent, "name", "Nome", 1)
        self.combo(parent, "category", "Categoria", CATEGORIES, 2)
        self.combo(parent, "exerciseKind", "Tipo", KINDS, 3)
        self.entry(parent, "focus", "Foco", 4)
        self.entry(parent, "rest", "Descanso (seg)", 5)
        self.entry(parent, "met", "MET", 6)
        self.entry(parent, "videoKey", "Video key", 7)
        self.text(parent, "description", "Descricao", 8, 4)
        self.text(parent, "tips", "Dicas (uma por linha)", 9, 5)
        self.multi_select(parent, "muscles", "Musculos", 10)
        self.multi_select(parent, "equipment", "Equipamentos", 11)
        self.multi_select(parent, "alternatives", "Alternativas", 12)
        self.text(parent, "illustrations", "Ilustracoes (uma por linha)", 13, 4)

        preview = ttk.LabelFrame(parent, text="Preview do exercicio", padding=10)
        preview.grid(row=14, column=0, columnspan=2, sticky="ew", padx=8, pady=12)
        self.preview_label = ttk.Label(preview, text="Selecione um exercicio.", justify=LEFT)
        self.preview_label.pack(anchor="w")

    def default_item(self) -> dict[str, Any]:
        return {
            "id": "novo_exercicio",
            "name": "Novo exercicio",
            "category": "puxar",
            "exerciseKind": "composto",
            "focus": "",
            "muscles": [],
            "equipment": [],
            "rest": 60,
            "met": None,
            "description": "",
            "tips": [],
            "alternatives": [],
            "videoKey": "",
            "illustrations": [],
        }

    def filtered_items(self) -> list[tuple[int, dict[str, Any]]]:
        rows = super().filtered_items()
        if self.category_filter.get() != "todos":
            rows = [(index, item) for index, item in rows if item.get("category") == self.category_filter.get()]
        if self.available_filter.get() != "todos":
            want_available = self.available_filter.get() == "disponiveis"
            rows = [(index, item) for index, item in rows if self.is_available(item) == want_available]
        return rows

    def options_for(self, field: str) -> list[tuple[str, str]]:
        if field == "muscles":
            return [(item["id"], item.get("title", item["id"])) for item in self.app.data["muscles"]]
        if field == "equipment":
            return [(item["id"], item.get("name", item["id"])) for item in self.app.data["equipment"]]
        if field == "alternatives":
            current_id = str(self.vars.get("id", tk.StringVar()).get())
            return [
                (item["id"], item.get("name", item["id"]))
                for item in self.app.data["exercises"]
                if item.get("id") != current_id
            ]
        return []

    def is_available(self, item: dict[str, Any]) -> bool:
        if item.get("availableByDefault") is False:
            return False
        equipment = item.get("equipment") or []
        if not equipment:
            return True
        inventory = {entry["id"]: entry for entry in self.app.data["equipment"]}
        return any(inventory.get(equipment_id, {}).get("available") for equipment_id in equipment)

    def item_errors(self, item: dict[str, Any]) -> list[str]:
        errors: list[str] = []
        ids = [entry.get("id") for entry in self.app.data["exercises"]]
        muscle_ids = {entry.get("id") for entry in self.app.data["muscles"]}
        equipment_ids = {entry.get("id") for entry in self.app.data["equipment"]}
        exercise_ids = {entry.get("id") for entry in self.app.data["exercises"]}
        if not item.get("id"):
            errors.append("id vazio")
        if ids.count(item.get("id")) > 1:
            errors.append("id duplicado")
        if not item.get("name"):
            errors.append("nome vazio")
        if item.get("category") not in CATEGORIES:
            errors.append("categoria invalida")
        if item.get("exerciseKind") not in KINDS:
            errors.append("tipo invalido")
        if not item.get("muscles"):
            errors.append("sem musculo")
        errors.extend(f"musculo inexistente: {value}" for value in item.get("muscles", []) if value not in muscle_ids)
        errors.extend(f"equipamento inexistente: {value}" for value in item.get("equipment", []) if value not in equipment_ids)
        errors.extend(f"alternativa inexistente: {value}" for value in item.get("alternatives", []) if value not in exercise_ids)
        rest = item.get("rest", 0)
        if not isinstance(rest, (int, float)) or rest < 0:
            errors.append("descanso invalido")
        met = item.get("met")
        if met is not None and (not isinstance(met, (int, float)) or met <= 0):
            errors.append("MET invalido")
        return errors

    def item_warnings(self, item: dict[str, Any]) -> list[str]:
        warnings: list[str] = []
        if not self.is_available(item):
            warnings.append("indisponivel nesta academia")
        for image in item.get("illustrations", []) or []:
            if not public_path(image).exists():
                warnings.append(f"ilustracao ausente: {image}")
        if not item.get("videoKey"):
            warnings.append("sem videoKey")
        return warnings

    def update_preview(self, item: dict[str, Any]) -> None:
        equipment = item.get("equipment") or []
        status = "Disponivel nesta academia" if self.is_available(item) else "Nao disponivel nesta academia"
        illustrations = len(item.get("illustrations") or [])
        video = "video cadastrado" if item.get("videoKey") else "video faltando"
        self.preview_label.configure(
            text=(
                f"{item.get('name', '-')}\n"
                f"Foco: {item.get('focus', '-')}\n"
                f"Musculos: {', '.join(item.get('muscles') or []) or '-'}\n"
                f"Equipamentos: {', '.join(equipment) or 'sem equipamento'}\n"
                f"{status} | descanso {item.get('rest', '-')}s | {video} | {illustrations} ilustracao(oes)"
            )
        )


class MuscleTab(SidebarFormTab):
    key = "muscles"
    title = "Musculos"

    def build_form(self, parent: ttk.Frame) -> None:
        self.entry(parent, "id", "ID", 0)
        self.entry(parent, "title", "Titulo", 1)
        self.entry(parent, "group", "Grupo", 2)
        self.text(parent, "description", "Descricao", 3, 5)
        self.text(parent, "tips", "Dicas (uma por linha)", 4, 5)
        self.entry(parent, "image", "Imagem", 5)
        ttk.Button(parent, text="Escolher imagem", command=self.choose_image).grid(row=6, column=1, sticky="w", padx=8, pady=4)
        preview = ttk.LabelFrame(parent, text="Preview", padding=10)
        preview.grid(row=7, column=0, columnspan=2, sticky="ew", padx=8, pady=12)
        self.preview_label = ttk.Label(preview, text="Imagem do musculo")
        self.preview_label.pack(anchor="w")

    def default_item(self) -> dict[str, Any]:
        return {"id": "novo_musculo", "title": "Novo musculo", "group": "", "description": "", "tips": [], "image": ""}

    def choose_image(self) -> None:
        initial = ROOT / "frontend" / "public" / "musculos"
        file_name = filedialog.askopenfilename(
            title="Selecionar imagem",
            initialdir=str(initial) if initial.exists() else str(ROOT),
            filetypes=[("Imagens", "*.png *.gif *.jpg *.jpeg")],
        )
        if not file_name:
            return
        path = Path(file_name)
        try:
            rel = "/" + path.relative_to(ROOT / "frontend" / "public").as_posix()
        except ValueError:
            messagebox.showwarning("Imagem fora da pasta", "Escolha uma imagem dentro de frontend/public/musculos/.")
            return
        self.vars["image"].set(rel)
        self.show_image(rel)

    def item_errors(self, item: dict[str, Any]) -> list[str]:
        errors = []
        ids = [entry.get("id") for entry in self.app.data["muscles"]]
        if not item.get("id"):
            errors.append("id vazio")
        if ids.count(item.get("id")) > 1:
            errors.append("id duplicado")
        if not item.get("title"):
            errors.append("titulo vazio")
        if item.get("image") and not public_path(item["image"]).exists():
            errors.append("imagem inexistente")
        return errors

    def update_preview(self, item: dict[str, Any]) -> None:
        self.show_image(str(item.get("image") or ""))

    def show_image(self, image_path: str) -> None:
        if not image_path:
            self.preview_label.configure(image="", text="Sem imagem cadastrada.")
            return
        path = public_path(image_path)
        if not path.exists():
            self.preview_label.configure(image="", text=f"Imagem nao encontrada: {image_path}")
            return
        try:
            photo = tk.PhotoImage(file=str(path))
            factor = max(photo.width() // 240, photo.height() // 180, 1)
            if factor > 1:
                photo = photo.subsample(factor, factor)
            self.preview_image = photo
            self.preview_label.configure(image=photo, text="")
        except Exception:
            self.preview_label.configure(image="", text="Preview indisponivel para este formato.")


class EquipmentTab(SidebarFormTab):
    key = "equipment"
    title = "Equipamentos"

    def build_filters(self, parent: ttk.Frame) -> None:
        ttk.Label(parent, text="Disponibilidade").pack(anchor="w")
        availability = ttk.Combobox(
            parent,
            textvariable=self.available_filter,
            values=["todos", "disponiveis", "indisponiveis"],
            state="readonly",
        )
        availability.pack(fill=X, pady=(0, 8))
        availability.bind("<<ComboboxSelected>>", lambda _event: self.refresh_list())

    def build_form(self, parent: ttk.Frame) -> None:
        self.entry(parent, "id", "ID", 0)
        self.entry(parent, "name", "Nome", 1)
        self.combo(parent, "type", "Tipo", EQUIPMENT_TYPES, 2)
        self.checkbox(parent, "available", "Disponivel nesta academia", 3)
        self.text(parent, "notes", "Notas", 4, 4)
        self.badge = ttk.Label(parent, text="Status", font=("Segoe UI", 12, "bold"))
        self.badge.grid(row=5, column=1, sticky="w", padx=8, pady=10)

    def default_item(self) -> dict[str, Any]:
        return {"id": "novo_equipamento", "name": "Novo equipamento", "type": "outro", "available": True, "notes": ""}

    def filtered_items(self) -> list[tuple[int, dict[str, Any]]]:
        rows = super().filtered_items()
        if self.available_filter.get() != "todos":
            want_available = self.available_filter.get() == "disponiveis"
            rows = [(index, item) for index, item in rows if bool(item.get("available")) == want_available]
        return rows

    def item_errors(self, item: dict[str, Any]) -> list[str]:
        errors = []
        ids = [entry.get("id") for entry in self.app.data["equipment"]]
        if not item.get("id"):
            errors.append("id vazio")
        if ids.count(item.get("id")) > 1:
            errors.append("id duplicado")
        if not item.get("name"):
            errors.append("nome vazio")
        if item.get("type") not in EQUIPMENT_TYPES:
            errors.append("tipo invalido")
        return errors

    def update_preview(self, item: dict[str, Any]) -> None:
        if bool(item.get("available")):
            self.badge.configure(text="Disponivel", foreground="#22c55e")
        else:
            self.badge.configure(text="Indisponivel", foreground="#f97316")


class VideoTab(SidebarFormTab):
    key = "videos"
    title = "Videos"
    id_field = "exerciseId"

    def build_form(self, parent: ttk.Frame) -> None:
        self.combo(parent, "exerciseId", "Exercicio", self.exercise_options(), 0)
        self.entry(parent, "youtube", "YouTube", 1)
        ttk.Button(parent, text="Abrir YouTube", command=lambda: self.open_url("youtube")).grid(row=1, column=2, padx=4)
        self.entry(parent, "tiktok", "TikTok", 2)
        ttk.Button(parent, text="Abrir TikTok", command=lambda: self.open_url("tiktok")).grid(row=2, column=2, padx=4)
        self.entry(parent, "sourceName", "Fonte", 3)
        self.text(parent, "notes", "Notas", 4, 4)
        self.preview_label = ttk.Label(parent, text="Valide os links antes de gerar.", justify=LEFT)
        self.preview_label.grid(row=5, column=1, sticky="w", padx=8, pady=10)

    def default_item(self) -> dict[str, Any]:
        return {"exerciseId": "novo_exercicio", "youtube": "", "tiktok": "", "sourceName": "", "notes": ""}

    def exercise_options(self) -> list[str]:
        return [item.get("id", "") for item in self.app.data["exercises"] if item.get("id")]

    def refresh_reference_options(self) -> None:
        if "exerciseId" in self.vars:
            # ttk.Combobox is the grid slave tied to this variable.
            for child in self.form.winfo_children():
                if isinstance(child, ttk.Combobox) and child.cget("textvariable") == str(self.vars["exerciseId"]):
                    child.configure(values=self.exercise_options())

    def open_url(self, field: str) -> None:
        url = str(self.vars[field].get()).strip()
        if url:
            webbrowser.open(url)

    def item_errors(self, item: dict[str, Any]) -> list[str]:
        errors = []
        exercise_ids = {entry.get("id") for entry in self.app.data["exercises"]}
        if item.get("exerciseId") not in exercise_ids:
            errors.append("exerciseId inexistente")
        for field in ("youtube", "tiktok"):
            url = item.get(field)
            if url and not URL_RE.match(url):
                errors.append(f"{field} invalido")
        return errors

    def update_preview(self, item: dict[str, Any]) -> None:
        youtube = "YouTube OK" if item.get("youtube") else "sem YouTube"
        tiktok = "TikTok OK" if item.get("tiktok") else "sem TikTok"
        self.preview_label.configure(text=f"{item.get('exerciseId', '-')}: {youtube} | {tiktok}")


class IllustrationManagerTab(ttk.Frame):
    def __init__(self, master: tk.Widget, app: "TrainingAdminApp"):
        super().__init__(master, padding=12)
        self.app = app
        self.exercise_var = tk.StringVar()
        self.preview_image: tk.PhotoImage | None = None
        self.build()
        self.refresh()

    def build(self) -> None:
        top = ttk.Frame(self)
        top.pack(fill=X)
        ttk.Label(top, text="Ilustracoes", font=("Segoe UI", 15, "bold")).pack(side=LEFT)
        self.combo = ttk.Combobox(top, textvariable=self.exercise_var, state="readonly", width=42)
        self.combo.pack(side=LEFT, padx=12)
        self.combo.bind("<<ComboboxSelected>>", lambda _event: self.refresh_images())
        ttk.Button(top, text="Adicionar imagens", command=self.add_images).pack(side=LEFT, padx=4)
        ttk.Button(top, text="Remover selecionada", command=self.remove_image).pack(side=LEFT, padx=4)

        body = ttk.Frame(self)
        body.pack(fill=BOTH, expand=True, pady=12)
        self.listbox = tk.Listbox(body, height=14)
        self.listbox.pack(side=LEFT, fill=BOTH, expand=True)
        self.listbox.bind("<<ListboxSelect>>", lambda _event: self.show_preview())
        preview = ttk.LabelFrame(body, text="Preview", padding=10)
        preview.pack(side=LEFT, fill=BOTH, expand=True, padx=(12, 0))
        self.preview_label = ttk.Label(preview, text="Selecione uma imagem.")
        self.preview_label.pack(anchor="w")
        self.validation_label = ttk.Label(self, text="Escolha um exercicio para gerenciar as imagens.")
        self.validation_label.pack(anchor="w")

    def refresh(self) -> None:
        values = [item["id"] for item in self.app.data["exercises"] if item.get("id")]
        self.combo.configure(values=values)
        if values and self.exercise_var.get() not in values:
            self.exercise_var.set(values[0])
        self.refresh_images()

    def current_exercise(self) -> dict[str, Any] | None:
        return next((item for item in self.app.data["exercises"] if item.get("id") == self.exercise_var.get()), None)

    def refresh_images(self) -> None:
        self.listbox.delete(0, END)
        exercise = self.current_exercise()
        for image in (exercise or {}).get("illustrations", []) or []:
            self.listbox.insert(END, image)
        self.validate_images()

    def add_images(self) -> None:
        exercise = self.current_exercise()
        if not exercise:
            return
        files = filedialog.askopenfilenames(title="Selecionar imagens", filetypes=[("Imagens", "*.png *.gif *.jpg *.jpeg *.webp")])
        if not files:
            return
        target = ROOT / "frontend" / "public" / "exercicios" / exercise["id"]
        target.mkdir(parents=True, exist_ok=True)
        current = list(exercise.get("illustrations", []) or [])
        for source in files:
            suffix = Path(source).suffix.lower()
            name = f"{len(current) + 1:02d}{suffix}"
            shutil.copy2(source, target / name)
            current.append(f"/exercicios/{exercise['id']}/{name}")
        exercise["illustrations"] = current
        self.app.mark_dirty()
        self.refresh_images()

    def remove_image(self) -> None:
        exercise = self.current_exercise()
        selection = self.listbox.curselection()
        if not exercise or not selection:
            return
        image = self.listbox.get(selection[0])
        if not messagebox.askyesno("Remover", f"Remover {image} da lista?"):
            return
        exercise["illustrations"] = [value for value in exercise.get("illustrations", []) if value != image]
        self.app.mark_dirty()
        self.refresh_images()

    def show_preview(self) -> None:
        selection = self.listbox.curselection()
        if not selection:
            return
        path = public_path(self.listbox.get(selection[0]))
        if not path.exists():
            self.preview_label.configure(image="", text="Imagem nao encontrada.")
            return
        try:
            photo = tk.PhotoImage(file=str(path))
            factor = max(photo.width() // 320, photo.height() // 240, 1)
            if factor > 1:
                photo = photo.subsample(factor, factor)
            self.preview_image = photo
            self.preview_label.configure(image=photo, text="")
        except Exception:
            self.preview_label.configure(image="", text="Preview indisponivel para este formato.")

    def validate_images(self) -> None:
        exercise = self.current_exercise()
        missing = [image for image in (exercise or {}).get("illustrations", []) if not public_path(image).exists()]
        if missing:
            self.validation_label.configure(text="Imagens ausentes: " + ", ".join(missing[:4]), foreground="#ef4444")
        else:
            self.validation_label.configure(text="OK - ilustracoes vinculadas ao exercicio.", foreground="#22c55e")


class TrainingPlanTab(ttk.Frame):
    def __init__(self, master: tk.Widget, app: "TrainingAdminApp"):
        super().__init__(master, padding=12)
        self.app = app
        self.plan_var = tk.StringVar()
        self.week_var = tk.StringVar()
        self.day_var = tk.StringVar()
        self.exercise_var = tk.StringVar()
        self.show_unavailable = tk.BooleanVar(value=False)
        self.plan_fields: dict[str, tk.StringVar] = {}
        self.day_fields: dict[str, tk.StringVar] = {}
        self.build()
        self.refresh()

    def build(self) -> None:
        top = ttk.Frame(self)
        top.pack(fill=X)
        ttk.Label(top, text="Treinos", font=("Segoe UI", 15, "bold")).pack(side=LEFT)
        self.plan_combo = ttk.Combobox(top, textvariable=self.plan_var, state="readonly", width=32)
        self.plan_combo.pack(side=LEFT, padx=8)
        self.plan_combo.bind("<<ComboboxSelected>>", lambda _event: self.load_plan())
        ttk.Button(top, text="Novo plano", command=self.new_plan).pack(side=LEFT, padx=3)
        ttk.Button(top, text="Duplicar plano", command=self.duplicate_plan).pack(side=LEFT, padx=3)
        ttk.Button(top, text="Remover plano", command=self.delete_plan).pack(side=LEFT, padx=3)

        body = ttk.Frame(self)
        body.pack(fill=BOTH, expand=True, pady=12)

        left = ttk.Frame(body)
        left.pack(side=LEFT, fill=Y)
        self.add_entry(left, self.plan_fields, "id", "ID do plano", 0)
        self.add_entry(left, self.plan_fields, "name", "Nome do plano", 1)
        self.add_entry(left, self.plan_fields, "phase", "Fase", 2)
        ttk.Button(left, text="Salvar dados do plano", command=self.save_plan_fields).grid(row=3, column=1, sticky="ew", padx=6, pady=6)

        ttk.Label(left, text="Semana").grid(row=4, column=0, sticky="w", padx=6, pady=(16, 4))
        self.week_combo = ttk.Combobox(left, textvariable=self.week_var, state="readonly")
        self.week_combo.grid(row=4, column=1, sticky="ew", padx=6, pady=(16, 4))
        self.week_combo.bind("<<ComboboxSelected>>", lambda _event: self.refresh_days())
        week_buttons = ttk.Frame(left)
        week_buttons.grid(row=5, column=1, sticky="ew", padx=6)
        ttk.Button(week_buttons, text="Nova", command=self.new_week).pack(side=LEFT, expand=True, fill=X)
        ttk.Button(week_buttons, text="Duplicar", command=self.duplicate_week).pack(side=LEFT, expand=True, fill=X, padx=4)
        ttk.Button(week_buttons, text="Remover", command=self.delete_week).pack(side=LEFT, expand=True, fill=X)

        ttk.Label(left, text="Dia").grid(row=6, column=0, sticky="w", padx=6, pady=(16, 4))
        self.day_combo = ttk.Combobox(left, textvariable=self.day_var, state="readonly")
        self.day_combo.grid(row=6, column=1, sticky="ew", padx=6, pady=(16, 4))
        self.day_combo.bind("<<ComboboxSelected>>", lambda _event: self.load_day())
        day_buttons = ttk.Frame(left)
        day_buttons.grid(row=7, column=1, sticky="ew", padx=6)
        ttk.Button(day_buttons, text="Novo", command=self.new_day).pack(side=LEFT, expand=True, fill=X)
        ttk.Button(day_buttons, text="Duplicar", command=self.duplicate_day).pack(side=LEFT, expand=True, fill=X, padx=4)
        ttk.Button(day_buttons, text="Remover", command=self.delete_day).pack(side=LEFT, expand=True, fill=X)

        self.add_entry(left, self.day_fields, "day", "Nome do dia", 8)
        self.add_entry(left, self.day_fields, "title", "Titulo", 9)
        self.add_entry(left, self.day_fields, "type", "Tipo", 10)
        ttk.Button(left, text="Salvar dados do dia", command=self.save_day_fields).grid(row=11, column=1, sticky="ew", padx=6, pady=6)

        center = ttk.Frame(body)
        center.pack(side=LEFT, fill=BOTH, expand=True, padx=14)
        ttk.Label(center, text="Exercicios do dia", font=("Segoe UI", 12, "bold")).pack(anchor="w")
        self.day_exercises = tk.Listbox(center, height=18, exportselection=False)
        self.day_exercises.pack(fill=BOTH, expand=True, pady=6)
        row = ttk.Frame(center)
        row.pack(fill=X)
        ttk.Button(row, text="Subir", command=lambda: self.move_exercise(-1)).pack(side=LEFT, expand=True, fill=X)
        ttk.Button(row, text="Descer", command=lambda: self.move_exercise(1)).pack(side=LEFT, expand=True, fill=X, padx=4)
        ttk.Button(row, text="Remover", command=self.remove_exercise).pack(side=LEFT, expand=True, fill=X)

        right = ttk.Frame(body)
        right.pack(side=LEFT, fill=BOTH, expand=True)
        ttk.Label(right, text="Adicionar exercicio", font=("Segoe UI", 12, "bold")).pack(anchor="w")
        self.exercise_search = tk.StringVar()
        search = ttk.Entry(right, textvariable=self.exercise_search)
        search.pack(fill=X, pady=(0, 6))
        search.bind("<KeyRelease>", lambda _event: self.refresh_exercise_options())
        self.exercise_combo = ttk.Combobox(right, textvariable=self.exercise_var, state="readonly")
        self.exercise_combo.pack(fill=X, pady=4)
        ttk.Checkbutton(right, text="Mostrar indisponiveis", variable=self.show_unavailable, command=self.refresh_exercise_options).pack(anchor="w")
        ttk.Button(right, text="Adicionar ao dia", command=self.add_exercise).pack(anchor="w", pady=8)
        self.validation = ttk.Label(right, text="Selecione plano, semana e dia.", justify=LEFT)
        self.validation.pack(anchor="w", pady=10)

    def add_entry(self, parent: ttk.Frame, target: dict[str, tk.StringVar], field: str, label: str, row: int) -> None:
        ttk.Label(parent, text=label).grid(row=row, column=0, sticky="w", padx=6, pady=4)
        var = tk.StringVar()
        ttk.Entry(parent, textvariable=var).grid(row=row, column=1, sticky="ew", padx=6, pady=4)
        target[field] = var

    def refresh(self) -> None:
        values = [plan.get("id") for plan in self.app.data["training_plans"] if plan.get("id")]
        self.plan_combo.configure(values=values)
        if values and self.plan_var.get() not in values:
            self.plan_var.set(values[0])
        self.load_plan()
        self.refresh_exercise_options()

    def current_plan(self) -> dict[str, Any] | None:
        return next((plan for plan in self.app.data["training_plans"] if plan.get("id") == self.plan_var.get()), None)

    def current_week(self) -> dict[str, Any] | None:
        plan = self.current_plan()
        return next((week for week in (plan or {}).get("weeks", []) if week.get("id") == self.week_var.get()), None)

    def current_day(self) -> dict[str, Any] | None:
        week = self.current_week()
        return next((day for day in (week or {}).get("days", []) if day.get("id") == self.day_var.get()), None)

    def load_plan(self) -> None:
        plan = self.current_plan()
        if not plan:
            return
        for field, var in self.plan_fields.items():
            var.set(str(plan.get(field, "")))
        self.refresh_weeks()

    def save_plan_fields(self) -> None:
        plan = self.current_plan()
        if not plan:
            return
        old_id = plan.get("id")
        for field, var in self.plan_fields.items():
            plan[field] = var.get().strip()
        if plan.get("id") != old_id:
            self.plan_var.set(plan.get("id", ""))
        self.app.mark_dirty()
        self.refresh()

    def refresh_weeks(self) -> None:
        weeks = (self.current_plan() or {}).get("weeks", [])
        values = [week.get("id") for week in weeks if week.get("id")]
        self.week_combo.configure(values=values)
        if values and self.week_var.get() not in values:
            self.week_var.set(values[0])
        self.refresh_days()

    def refresh_days(self) -> None:
        days = (self.current_week() or {}).get("days", [])
        values = [day.get("id") for day in days if day.get("id")]
        self.day_combo.configure(values=values)
        if values and self.day_var.get() not in values:
            self.day_var.set(values[0])
        self.load_day()

    def load_day(self) -> None:
        day = self.current_day()
        if not day:
            return
        for field, var in self.day_fields.items():
            var.set(str(day.get(field, "")))
        self.refresh_day_exercises()

    def save_day_fields(self) -> None:
        day = self.current_day()
        if not day:
            return
        old_id = day.get("id")
        for field, var in self.day_fields.items():
            day[field] = var.get().strip()
        day["id"] = stable_id(f"{day.get('week', self.week_var.get())}_{day.get('day', '')}", str(old_id or "dia"))
        day["week"] = self.week_var.get()
        if day.get("id") != old_id:
            self.day_var.set(day.get("id", ""))
        self.app.mark_dirty()
        self.refresh_days()

    def refresh_day_exercises(self) -> None:
        self.day_exercises.delete(0, END)
        for exercise in (self.current_day() or {}).get("exercises", []):
            name = self.exercise_name(exercise.get("id"))
            self.day_exercises.insert(END, f"{exercise.get('order', '-')}. {exercise.get('id')} - {name}")
        self.validate_day()

    def refresh_exercise_options(self) -> None:
        query = self.exercise_search.get().strip().lower() if hasattr(self, "exercise_search") else ""
        options = []
        for exercise in self.app.data["exercises"]:
            if query and query not in json.dumps(exercise, ensure_ascii=False).lower():
                continue
            if not self.show_unavailable.get() and not self.exercise_available(exercise):
                continue
            options.append(f"{exercise['id']} - {exercise.get('name', '')}")
        self.exercise_combo.configure(values=options)
        if options and self.exercise_var.get() not in options:
            self.exercise_var.set(options[0])

    def exercise_available(self, exercise: dict[str, Any]) -> bool:
        if exercise.get("availableByDefault") is False:
            return False
        equipment = exercise.get("equipment") or []
        if not equipment:
            return True
        inventory = {entry["id"]: entry for entry in self.app.data["equipment"]}
        return any(inventory.get(equipment_id, {}).get("available") for equipment_id in equipment)

    def exercise_name(self, exercise_id: str | None) -> str:
        exercise = next((entry for entry in self.app.data["exercises"] if entry.get("id") == exercise_id), None)
        return str((exercise or {}).get("name", ""))

    def add_exercise(self) -> None:
        day = self.current_day()
        if not day or not self.exercise_var.get():
            return
        exercise_id = self.exercise_var.get().split(" - ", 1)[0]
        library_item = next((entry for entry in self.app.data["exercises"] if entry.get("id") == exercise_id), {})
        day.setdefault("exercises", []).append(
            {
                "id": exercise_id,
                "order": len(day.get("exercises", [])) + 1,
                "name": library_item.get("name"),
                "focus": library_item.get("focus"),
                "rest": library_item.get("rest"),
                "alternatives": library_item.get("alternatives", []),
                "videoKey": library_item.get("videoKey"),
            }
        )
        self.app.mark_dirty()
        self.refresh_day_exercises()

    def remove_exercise(self) -> None:
        day = self.current_day()
        selection = self.day_exercises.curselection()
        if not day or not selection:
            return
        del day["exercises"][selection[0]]
        self.renumber(day)
        self.app.mark_dirty()
        self.refresh_day_exercises()

    def move_exercise(self, delta: int) -> None:
        day = self.current_day()
        selection = self.day_exercises.curselection()
        if not day or not selection:
            return
        source = selection[0]
        target = source + delta
        if target < 0 or target >= len(day.get("exercises", [])):
            return
        day["exercises"][source], day["exercises"][target] = day["exercises"][target], day["exercises"][source]
        self.renumber(day)
        self.app.mark_dirty()
        self.refresh_day_exercises()
        self.day_exercises.selection_set(target)

    def renumber(self, day: dict[str, Any]) -> None:
        for index, exercise in enumerate(day.get("exercises", []), start=1):
            exercise["order"] = index

    def new_plan(self) -> None:
        plan = {"id": "novo_plano", "name": "Novo plano", "phase": "fase1", "weeks": []}
        self.app.data["training_plans"].append(plan)
        self.plan_var.set(plan["id"])
        self.app.mark_dirty()
        self.refresh()

    def duplicate_plan(self) -> None:
        plan = self.current_plan()
        if not plan:
            return
        copy = json_clone(plan)
        copy["id"] = f"{copy.get('id', 'plano')}_copia"
        copy["name"] = f"{copy.get('name', 'Plano')} copia"
        self.app.data["training_plans"].append(copy)
        self.plan_var.set(copy["id"])
        self.app.mark_dirty()
        self.refresh()

    def delete_plan(self) -> None:
        plan = self.current_plan()
        if not plan or not messagebox.askyesno("Remover", f"Remover plano {plan.get('name')}?"):
            return
        self.app.data["training_plans"] = [entry for entry in self.app.data["training_plans"] if entry is not plan]
        self.plan_var.set("")
        self.app.mark_dirty()
        self.refresh()

    def new_week(self) -> None:
        plan = self.current_plan()
        if not plan:
            return
        week_id = chr(ord("A") + len(plan.get("weeks", [])))
        plan.setdefault("weeks", []).append({"id": week_id, "label": f"Semana {week_id}", "phase": plan.get("phase"), "days": []})
        self.week_var.set(week_id)
        self.app.mark_dirty()
        self.refresh_weeks()

    def duplicate_week(self) -> None:
        plan = self.current_plan()
        week = self.current_week()
        if not plan or not week:
            return
        copy = json_clone(week)
        copy["id"] = f"{copy.get('id', 'semana')}_copia"
        copy["label"] = f"{copy.get('label', 'Semana')} copia"
        for day in copy.get("days", []):
            day["week"] = copy["id"]
            day["id"] = stable_id(f"{copy['id']}_{day.get('day', '')}", str(day.get("id", "dia")))
        plan.setdefault("weeks", []).append(copy)
        self.week_var.set(copy["id"])
        self.app.mark_dirty()
        self.refresh_weeks()

    def delete_week(self) -> None:
        plan = self.current_plan()
        week = self.current_week()
        if not plan or not week or not messagebox.askyesno("Remover", f"Remover semana {week.get('id')}?"):
            return
        plan["weeks"] = [entry for entry in plan.get("weeks", []) if entry is not week]
        self.week_var.set("")
        self.app.mark_dirty()
        self.refresh_weeks()

    def new_day(self) -> None:
        week = self.current_week()
        if not week:
            return
        day_name = DAY_NAMES[min(len(week.get("days", [])), len(DAY_NAMES) - 1)]
        day = {
            "id": stable_id(f"{week.get('id')}_{day_name}", "dia"),
            "week": week.get("id"),
            "day": day_name,
            "title": "Novo treino",
            "type": "puxar",
            "exercises": [],
        }
        week.setdefault("days", []).append(day)
        self.day_var.set(day["id"])
        self.app.mark_dirty()
        self.refresh_days()

    def duplicate_day(self) -> None:
        week = self.current_week()
        day = self.current_day()
        if not week or not day:
            return
        copy = json_clone(day)
        copy["id"] = f"{copy.get('id', 'dia')}_copia"
        copy["title"] = f"{copy.get('title', 'Dia')} copia"
        week.setdefault("days", []).append(copy)
        self.day_var.set(copy["id"])
        self.app.mark_dirty()
        self.refresh_days()

    def delete_day(self) -> None:
        week = self.current_week()
        day = self.current_day()
        if not week or not day or not messagebox.askyesno("Remover", f"Remover dia {day.get('title')}?"):
            return
        week["days"] = [entry for entry in week.get("days", []) if entry is not day]
        self.day_var.set("")
        self.app.mark_dirty()
        self.refresh_days()

    def validate_day(self) -> None:
        day = self.current_day()
        if not day:
            self.validation.configure(text="Selecione um dia.", foreground="#d97706")
            return
        exercise_ids = {entry.get("id") for entry in self.app.data["exercises"]}
        missing = [entry.get("id") for entry in day.get("exercises", []) if entry.get("id") not in exercise_ids]
        unavailable = []
        by_id = {entry.get("id"): entry for entry in self.app.data["exercises"]}
        for entry in day.get("exercises", []):
            exercise = by_id.get(entry.get("id"))
            if exercise and not self.exercise_available(exercise):
                unavailable.append(entry.get("id"))
        if missing:
            self.validation.configure(text="Exercicios inexistentes: " + ", ".join(missing), foreground="#ef4444")
        elif unavailable:
            self.validation.configure(text="Aviso: indisponiveis no dia: " + ", ".join(unavailable), foreground="#d97706")
        else:
            self.validation.configure(text="OK - dia pronto.", foreground="#22c55e")


class TrainingAdminApp:
    def __init__(self):
        self.data = load_all()
        self.dirty = False
        if ctk:
            ctk.set_appearance_mode("dark")
            ctk.set_default_color_theme("dark-blue")
            self.root = ctk.CTk()
        else:
            self.root = tk.Tk()
        self.root.title("Treino Loloa Admin")
        self.root.geometry("1360x860")
        self.status_var = tk.StringVar(value="Salvo")
        self.build_style()
        self.build()
        self.bind_shortcuts()

    def build_style(self) -> None:
        style = ttk.Style()
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass
        style.configure(".", font=("Segoe UI", 10))
        style.configure("TFrame", background="#15111d")
        style.configure("TLabel", background="#15111d", foreground="#f8f4ff")
        style.configure("TLabelframe", background="#15111d", foreground="#f8f4ff")
        style.configure("TLabelframe.Label", background="#15111d", foreground="#f4a6c1", font=("Segoe UI", 10, "bold"))
        style.configure("TButton", padding=(10, 6))
        style.configure("TNotebook", background="#15111d", borderwidth=0)
        style.configure("TNotebook.Tab", padding=(14, 8))

    def build(self) -> None:
        header = ttk.Frame(self.root, padding=12)
        header.pack(fill=X)
        ttk.Label(header, text="Treino Loloa Admin", font=("Segoe UI", 18, "bold"), foreground="#f4a6c1").pack(side=LEFT)
        ttk.Button(header, text="Salvar tudo", command=self.save_data).pack(side=RIGHT, padx=4)
        ttk.Button(header, text="Gerar TypeScript", command=self.generate_ts).pack(side=RIGHT, padx=4)
        ttk.Button(header, text="Validar", command=self.validate_all).pack(side=RIGHT, padx=4)
        ttk.Button(header, text="Gerar + Testar", command=self.generate_and_test).pack(side=RIGHT, padx=4)

        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=BOTH, expand=True, padx=12)

        self.exercise_tab = ExerciseTab(self.notebook, self)
        self.muscle_tab = MuscleTab(self.notebook, self)
        self.equipment_tab = EquipmentTab(self.notebook, self)
        self.video_tab = VideoTab(self.notebook, self)
        self.illustration_tab = IllustrationManagerTab(self.notebook, self)
        self.training_tab = TrainingPlanTab(self.notebook, self)
        self.tabs = [
            self.exercise_tab,
            self.muscle_tab,
            self.equipment_tab,
            self.video_tab,
            self.illustration_tab,
            self.training_tab,
        ]
        for tab, title in [
            (self.exercise_tab, "Exercicios"),
            (self.muscle_tab, "Musculos"),
            (self.equipment_tab, "Equipamentos"),
            (self.video_tab, "Videos"),
            (self.illustration_tab, "Ilustracoes"),
            (self.training_tab, "Treinos"),
        ]:
            self.notebook.add(tab, text=title)

        bottom = ttk.LabelFrame(self.root, text="Validacao, logs e status", padding=10)
        bottom.pack(fill=X, padx=12, pady=12)
        status_row = ttk.Frame(bottom)
        status_row.pack(fill=X)
        ttk.Label(status_row, textvariable=self.status_var, foreground="#c9b6ff").pack(side=LEFT)
        self.validation_summary = ttk.Label(status_row, text="Selecione um item para ver a validacao.")
        self.validation_summary.pack(side=LEFT, padx=20)
        self.log = tk.Text(bottom, height=7, wrap="word", bg="#100c16", fg="#f8f4ff", insertbackground="#f8f4ff")
        self.log.pack(fill=X, pady=(8, 0))

    def bind_shortcuts(self) -> None:
        self.root.bind("<Control-s>", lambda _event: self.save_data())
        self.root.bind("<Control-n>", lambda _event: self.active_action("new_item"))
        self.root.bind("<Control-d>", lambda _event: self.active_action("duplicate_item"))
        self.root.bind("<Delete>", lambda _event: self.active_action("delete_item"))
        self.root.bind("<Control-f>", lambda _event: self.focus_search())

    def active_tab(self) -> tk.Widget | None:
        selected = self.notebook.select()
        return self.root.nametowidget(selected) if selected else None

    def active_action(self, name: str) -> None:
        tab = self.active_tab()
        if hasattr(tab, name):
            getattr(tab, name)()

    def focus_search(self) -> None:
        tab = self.active_tab()
        if hasattr(tab, "search_entry"):
            tab.search_entry.focus_set()
        elif hasattr(tab, "exercise_search"):
            tab.exercise_search.focus_set()

    def sync_active_tab(self) -> None:
        tab = self.active_tab()
        if hasattr(tab, "save_current"):
            tab.save_current(silent=True)

    def refresh_reference_tabs(self) -> None:
        for tab in self.tabs:
            if hasattr(tab, "refresh"):
                tab.refresh()
            elif hasattr(tab, "refresh_reference_options"):
                tab.refresh_reference_options()

    def mark_dirty(self) -> None:
        self.dirty = True
        self.status_var.set("Alteracoes nao salvas")

    def show_item_validation(self, errors: list[str], warnings: list[str]) -> None:
        if errors:
            self.validation_summary.configure(text="Erros: " + " | ".join(errors[:3]), foreground="#ef4444")
        elif warnings:
            self.validation_summary.configure(text="Avisos: " + " | ".join(warnings[:3]), foreground="#d97706")
        else:
            self.validation_summary.configure(text="OK", foreground="#22c55e")

    def write_log(self, message: str) -> None:
        self.log.insert(END, message.rstrip() + "\n")
        self.log.see(END)

    def validate_all(self) -> bool:
        self.sync_active_tab()
        errors = validate_data(self.data)
        if errors:
            self.write_log("Erros de validacao:\n- " + "\n- ".join(errors[:80]))
            self.status_var.set("Erro de validacao")
            return False
        self.write_log("Validacao OK.")
        self.status_var.set("OK")
        return True

    def save_data(self) -> None:
        self.sync_active_tab()
        errors = validate_data(self.data)
        if errors:
            messagebox.showerror("Validacao", "Corrija antes de salvar:\n\n" + "\n".join(errors[:25]))
            self.write_log("Salvar bloqueado por erros de validacao.")
            self.status_var.set("Erro ao salvar")
            return
        save_all(self.data, validate=False)
        self.dirty = False
        self.status_var.set("Salvo")
        self.write_log("Dados salvos com backup automatico.")
        self.refresh_reference_tabs()

    def generate_ts(self) -> bool:
        self.sync_active_tab()
        try:
            files = generate(self.data)
        except Exception as exc:
            self.write_log(f"Erro ao gerar TypeScript: {exc}")
            self.status_var.set("Erro ao gerar")
            return False
        self.write_log("Arquivos gerados:\n" + "\n".join(str(file) for file in files))
        self.status_var.set("TypeScript gerado")
        return True

    def generate_and_test(self) -> None:
        threading.Thread(target=self._generate_and_test_worker, daemon=True).start()

    def _generate_and_test_worker(self) -> None:
        if not self.generate_ts():
            return
        commands: list[tuple[str, list[str], Path, bool]] = [
            ("Testes Python", [sys.executable, "-m", "unittest", "discover", "tools/training_admin/tests"], ROOT, False),
            ("npm run test", ["npm", "run", "test"], ROOT / "frontend", True),
            ("npm run build", ["npm", "run", "build"], ROOT / "frontend", True),
        ]
        for label, command, cwd, use_shell in commands:
            if not cwd.exists():
                self.write_log(f"{label}: pasta nao encontrada: {cwd}")
                self.status_var.set(f"Falhou: {label}")
                return
            self.write_log(f"Rodando {label}...")
            try:
                result = subprocess.run(
                    " ".join(command) if use_shell else command,
                    cwd=cwd,
                    capture_output=True,
                    text=True,
                    shell=use_shell,
                )
            except FileNotFoundError as exc:
                self.write_log(f"{label}: comando nao encontrado ({exc}).")
                self.status_var.set(f"Falhou: {label}")
                return
            if result.stdout:
                self.write_log(result.stdout)
            if result.stderr:
                self.write_log(result.stderr)
            if result.returncode != 0:
                self.status_var.set(f"Falhou: {label}")
                return
        self.status_var.set("Gerado e testado")

    def run(self) -> None:
        self.root.mainloop()


def main() -> int:
    TrainingAdminApp().run()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
