import { useState } from "react";
import { uploadImage } from "../../lib/adminContent";
import { Photo, imageName } from "../page/Photo";
import { Icon } from "../ui/Icon";

// One form field in the content editor, drawn from the collection's field list (src/data/content.js)
export const AdminField = ({ collection, field, value, onChange, idPrefix }) => {
    const id = `${idPrefix}-${field.name}`;
    const hint = field.help && <span className="hint" id={`${id}-hint`}>{field.help}</span>;
    const described = field.help ? `${id}-hint` : undefined;

    if (field.type === "bool") {
        return (
            <label className="admin-check" htmlFor={id}>
                <input id={id} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
                <span>{field.label}</span>
            </label>
        );
    }
    if (field.type === "images") return <ImagesField collection={collection} field={field} value={value ?? []} onChange={onChange} id={id} />;

    let control;
    if (field.type === "textarea") {
        control = <textarea id={id} rows={field.rows ?? 4} value={value ?? ""} onChange={(e) => onChange(e.target.value)} aria-describedby={described} />;
    } else if (field.type === "select") {
        control = (
            <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} aria-describedby={described}>
                <option value="">—</option>
                {field.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                ))}
            </select>
        );
    } else {
        const type = field.type === "date" ? "date" : field.type === "number" || field.type === "ugx" ? "text" : "text";
        control = (
            <input
                id={id}
                type={type}
                inputMode={field.type === "number" || field.type === "ugx" ? "numeric" : undefined}
                value={value ?? ""}
                required={field.required}
                placeholder={field.type === "ugx" ? "e.g. 120000" : undefined}
                onChange={(e) => onChange(e.target.value)}
                aria-describedby={described}
            />
        );
    }
    return (
        <div className="field">
            <label htmlFor={id}>
                {field.label}
                {field.required && " *"}
            </label>
            {control}
            {hint}
        </div>
    );
};

const ImagesField = ({ collection, field, value, onChange, id }) => {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const onFiles = async (event) => {
        const files = [...event.target.files];
        event.target.value = "";
        if (!files.length) return;
        setBusy(true);
        setError(null);
        try {
            const urls = [];
            for (const file of files) urls.push(await uploadImage(collection, file));
            onChange([...value, ...urls]);
        } catch (e) {
            setError(e.message || "Upload failed.");
        } finally {
            setBusy(false);
        }
    };
    const move = (i, d) => {
        const next = [...value];
        [next[i], next[i + d]] = [next[i + d], next[i]];
        onChange(next);
    };

    return (
        <fieldset className="field admin-images">
            <legend className="label">{field.label}</legend>
            {value.length > 0 && (
                <ul className="admin-thumbs">
                    {value.map((img, i) => (
                        <li key={`${imageName(img)}-${i}`}>
                            <Photo name={imageName(img)} alt="" ratio="1 / 1" sizes="120px" />
                            <div className="row" style={{ "--gap": "4px" }}>
                                <button type="button" className="icon-btn admin-mini" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move photo ${i + 1} earlier`}>
                                    <Icon name="arrowLeft" size={14} />
                                </button>
                                <button type="button" className="icon-btn admin-mini" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label={`Move photo ${i + 1} later`}>
                                    <Icon name="arrow" size={14} />
                                </button>
                                <button type="button" className="icon-btn admin-mini" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label={`Remove photo ${i + 1}`}>
                                    <Icon name="close" size={14} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <label className="btn btn-line btn-sm admin-upload" htmlFor={id}>
                <Icon name="plus" size={16} /> {busy ? "Uploading…" : "Add photos"}
            </label>
            <input id={id} className="sr-only" type="file" accept="image/*" multiple onChange={onFiles} disabled={busy} />
            <span className="hint">The first photo is the cover. Upload WebP or JPG, about 1600 px wide.</span>
            {error && <p className="alert alert-error" role="alert">{error}</p>}
        </fieldset>
    );
};
