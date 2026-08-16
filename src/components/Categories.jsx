import React from 'react';
import { categories } from '../data/products';

const categoryIcons = {
  popular: 'bi-stars',
  1: 'bi-controller',
  2: 'bi-ticket-perforated',
  3: 'bi-play-btn',
  4: 'bi-phone',
  6: 'bi-wallet2',
  7: 'bi-receipt',
  8: 'bi-gift',
  9: 'bi-cpu',
};

export default function Categories({ activeCategory, onSelectCategory }) {
  return (
    <nav className="wartop-category-shell" aria-label="Kategori produk">
      <div className="wartop-category-heading">
        <span>Jelajahi</span>
        <strong>Kategori</strong>
      </div>
      <div className="wartop-category-track" role="tablist" aria-label="Filter kategori produk">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              id={category.id === 'popular' ? 'popularButton' : `catButton_${category.id}`}
              className={`wartop-category-tab ${isActive ? 'is-active' : ''}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectCategory(category.id)}
            >
              <i className={`bi ${categoryIcons[category.id] || 'bi-grid'}`} aria-hidden="true"></i>
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
