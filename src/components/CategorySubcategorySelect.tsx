import { useMemo, useState } from 'react';
import {
  CATEGORY_CATALOG,
  CATEGORY_GROUPS,
  findCategoryBySlug,
  labelForSubcategorySlug,
  type CategoryCatalogItem,
  type SubcategoryOption,
} from '../data/categoryCatalog';

type Props = {
  value: string[];
  onChange: (slugs: string[]) => void;
  disabled?: boolean;
};

export function CategorySubcategorySelect({ value, onChange, disabled }: Props) {
  // Default to first category (Hourly Based Services)
  const [activeCatSlug, setActiveCatSlug] = useState<string>(
    CATEGORY_CATALOG[0]?.slug || 'hourly-helper'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeCategory: CategoryCatalogItem = useMemo(() => {
    return findCategoryBySlug(activeCatSlug) || CATEGORY_CATALOG[0];
  }, [activeCatSlug]);

  // Check if "All" is selected for active category
  const isCategoryAllSelected = useMemo(() => {
    return value.includes(activeCategory.slug);
  }, [value, activeCategory.slug]);

  // Toggle "All" for active category
  const toggleAll = () => {
    if (disabled) return;
    const allSlug = activeCategory.slug;
    const catSubSlugs = new Set(activeCategory.subcategories.map((s) => s.slug));

    if (isCategoryAllSelected) {
      // Remove all slugs belonging to this category
      onChange(value.filter((s) => !catSubSlugs.has(s)));
    } else {
      // Add parent slug, remove specific subcategory slugs to avoid redundancy
      const filtered = value.filter((s) => !catSubSlugs.has(s));
      onChange([...filtered, allSlug]);
    }
  };

  // Toggle specific subcategory
  const toggleSubcategory = (sub: SubcategoryOption) => {
    if (disabled) return;
    if (sub.isAll) {
      toggleAll();
      return;
    }

    const isCurrentlyChecked = value.includes(sub.slug);

    if (isCurrentlyChecked) {
      onChange(value.filter((s) => s !== sub.slug));
    } else {
      // If adding an individual subcategory, ensure "All" parent slug is removed
      const withoutAll = value.filter((s) => s !== activeCategory.slug);
      onChange([...withoutAll, sub.slug]);
    }
  };

  // Remove single target chip
  const removeSlug = (slugToRemove: string) => {
    if (disabled) return;
    onChange(value.filter((s) => s !== slugToRemove));
  };

  // Clear everything
  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  // Filter subcategories by search if query entered
  const filteredSubcategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeCategory.subcategories;
    return activeCategory.subcategories.filter(
      (sub) =>
        sub.label.toLowerCase().includes(q) || sub.slug.toLowerCase().includes(q)
    );
  }, [activeCategory, searchQuery]);

  // Selected count for this category
  const selectedCountForCategory = useMemo(() => {
    const catSubSlugs = new Set(activeCategory.subcategories.map((s) => s.slug));
    return value.filter((s) => catSubSlugs.has(s)).length;
  }, [value, activeCategory]);

  return (
    <div className={`cat-sub-select-wrap ${disabled ? 'is-disabled' : ''}`}>
      {/* 1. Category Selection Row */}
      <div className="cat-picker-row">
        <div className="cat-picker-field">
          <label className="cat-picker-label">1. Select Category</label>
          <select
            className="cat-select-dropdown"
            value={activeCatSlug}
            onChange={(e) => {
              setActiveCatSlug(e.target.value);
              setSearchQuery('');
            }}
            disabled={disabled}
          >
            {CATEGORY_GROUPS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.categories.map((cat) => {
                  const hasSelection = value.some((s) =>
                    cat.subcategories.some((sub) => sub.slug === s)
                  );
                  return (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.label} {hasSelection ? '✓' : ''}
                    </option>
                  );
                })}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="cat-search-field">
          <label className="cat-picker-label">Search in this category</label>
          <input
            type="text"
            className="cat-sub-search-input"
            placeholder="Filter subcategories…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* 2. Subcategory Selection Box */}
      <div className="subcat-panel">
        <div className="subcat-panel-header">
          <span className="subcat-panel-title">
            2. Choose Subcategories for <strong>{activeCategory.label}</strong>
          </span>
          {selectedCountForCategory > 0 ? (
            <span className="subcat-badge">
              {isCategoryAllSelected
                ? 'All selected'
                : `${selectedCountForCategory} selected`}
            </span>
          ) : (
            <span className="subcat-badge subcat-badge-muted">None selected</span>
          )}
        </div>

        <div className="subcat-grid">
          {filteredSubcategories.map((sub) => {
            const isChecked = sub.isAll
              ? isCategoryAllSelected
              : value.includes(sub.slug);

            return (
              <label
                key={sub.slug}
                className={`subcat-item ${isChecked ? 'is-checked' : ''} ${
                  sub.isAll ? 'is-all-option' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleSubcategory(sub)}
                  disabled={disabled}
                />
                <div className="subcat-item-content">
                  <span className="subcat-item-name">
                    {sub.isAll ? <strong>★ {sub.label}</strong> : sub.label}
                  </span>
                  <span className="subcat-item-slug">{sub.slug}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Active Target Summary */}
      <div className="selected-summary-box">
        <div className="selected-summary-header">
          <span className="selected-summary-title">
            Active Targets ({value.length}):
          </span>
          {value.length > 0 && !disabled ? (
            <button
              type="button"
              className="btn-clear-targets"
              onClick={clearAll}
            >
              Clear all targets
            </button>
          ) : null}
        </div>

        {value.length === 0 ? (
          <div className="selected-empty-hint">
            No specific categories or subcategories selected yet. Select a category and pick subcategories above.
          </div>
        ) : (
          <div className="selected-chips-grid">
            {value.map((slug) => (
              <span key={slug} className="target-chip">
                <span className="target-chip-text">
                  {labelForSubcategorySlug(slug)}
                </span>
                {!disabled ? (
                  <button
                    type="button"
                    className="target-chip-remove"
                    onClick={() => removeSlug(slug)}
                    title="Remove"
                  >
                    ×
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
