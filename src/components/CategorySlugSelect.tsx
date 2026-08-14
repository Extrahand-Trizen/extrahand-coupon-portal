import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORY_OPTIONS_GROUPED,
  labelForSlug,
  type CategoryOption,
} from '../data/categorySlugs';

type Props = {
  value: string[];
  onChange: (slugs: string[]) => void;
  disabled?: boolean;
};

export function CategorySlugSelect({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORY_OPTIONS_GROUPED.map((g) => ({
      group: g.group,
      options: q
        ? g.options.filter(
            (c) =>
              c.label.toLowerCase().includes(q) ||
              c.slug.toLowerCase().includes(q) ||
              c.group.toLowerCase().includes(q),
          )
        : g.options,
    })).filter((g) => g.options.length > 0);
  }, [query]);

  const toggle = (slug: string) => {
    if (disabled) return;
    if (value.includes(slug)) {
      onChange(value.filter((s) => s !== slug));
    } else {
      onChange([...value, slug]);
    }
  };

  return (
    <div className={`slug-select ${disabled ? 'is-disabled' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="slug-select-trigger"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        {value.length === 0 ? (
          <span className="slug-placeholder">
            Search &amp; select Book Now services or Post &amp; Compare categories...
          </span>
        ) : (
          <span className="slug-chips">
            {value.map((slug) => (
              <span key={slug} className="slug-chip">
                {labelForSlug(slug)}
                <span
                  role="button"
                  tabIndex={-1}
                  className="slug-chip-x"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(slug);
                  }}
                >
                  ×
                </span>
              </span>
            ))}
          </span>
        )}
        <span className="slug-caret">{open ? '▴' : '▾'}</span>
      </button>

      {open && !disabled ? (
        <div className="slug-dropdown">
          <input
            className="slug-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or slug…"
            autoFocus
          />
          <div className="slug-options">
            {filteredGroups.length === 0 ? (
              <div className="slug-empty">No services or categories match</div>
            ) : (
              filteredGroups.map((g) => (
                <div key={g.group} className="slug-group">
                  <div className="slug-group-label">{g.group}</div>
                  <ul>
                    {g.options.map((c: CategoryOption) => {
                      const checked = value.includes(c.slug);
                      return (
                        <li key={`${g.group}-${c.slug}`}>
                          <button
                            type="button"
                            className={`slug-option ${checked ? 'is-selected' : ''}`}
                            onClick={() => toggle(c.slug)}
                          >
                            <span className="slug-check">{checked ? '✓' : ''}</span>
                            <span>
                              <strong>{c.label}</strong>
                              <em>{c.slug}</em>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
