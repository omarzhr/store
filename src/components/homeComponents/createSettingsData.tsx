export function createSettingsData(formState: any) {
  return {
    hero: {
      enabled: formState.heroEnabled,
      title: formState.heroTitle.trim() || 'Premium Quality Products',
      subtitle: formState.heroSubtitle.trim() || 'Discover amazing deals with cash on delivery',
      ctaText: formState.heroCtaText.trim() || 'Shop Now',
      ctaLink: formState.removeHeroCtaLink ? '' : (formState.heroCtaLink.trim() || '/products'),
      backgroundLink: formState.removeHeroBackgroundLink ? '' : (formState.heroBackgroundLink.trim() || '')
    },
    header: {
      showSearch: formState.showSearchInHeader,
      showWishlist: formState.showWishlistInHeader,
      style: formState.headerStyle,
      logoLink: formState.removeLogoLink ? '' : (formState.logoLink.trim() || ''),
      logoUrl: formState.logoFile ? '' : (formState.logoUrl.trim() || '')
    },
    categories: {
      enabled: formState.categoriesEnabled,
      title: formState.categoriesTitle.trim() || 'Shop by Category',
      layout: formState.categoriesLayout,
      visibleCategories: formState.visibleCategories,
      showImages: formState.showCategoryImages
    },
    featured: {
      enabled: formState.featuredEnabled,
      title: formState.featuredTitle.trim() || 'Featured Products',
      limit: formState.featuredLimit,
      sortBy: formState.featuredSortBy
    },
    promoBanners: {
      enabled: formState.promoBannersEnabled,
      banners: formState.promoBanners.map((banner: any) => ({
        ...banner,
        title: banner.title.trim() || 'Banner Title',
        subtitle: banner.subtitle.trim() || 'Banner subtitle'
      }))
    },
    newsletter: {
      enabled: formState.newsletterEnabled,
      title: formState.newsletterTitle.trim() || 'Stay Updated',
      subtitle: formState.newsletterSubtitle.trim() || 'Subscribe to our newsletter and be the first to know about new products, exclusive offers, and special deals.'
    }
  }
}