import React, { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
  logo: string;
  copyright: string;
  copyright_bg_color: string;
  bg_type: string;
  bg_value: string;
  contact_wa: string;
  contact_email: string;
  favicon: string;
  header_title: string;
  page_description: string;
  qris_template_url: string;
  qris_text_y_pos: string;
  qris_text_size: string;
  qris_text_color: string;
  qris_text_width: string;
  qris_nmid_y_pos: string;
  qris_nmid_size: string;
  qris_nmid_color: string;
  qris_nmid_width: string;
  tutorial_video: string;
  hero_image: string;
  hero_bg_image: string;
  hero_bg_image_size: string;
  logo_bi: string;
  logo_kominfo: string;
  text_bi: string;
  text_kominfo: string;
  hero_badge_text: string;
  hero_feature_1: string;
  hero_feature_2: string;
  hero_feature_3: string;
  trust_title: string;
  trust_item_1: string;
  trust_item_2: string;
  trust_item_3: string;
  trust_item_4: string;
  features_title: string;
  features_subtitle: string;
  feature_1_title: string;
  feature_1_desc: string;
  feature_2_title: string;
  feature_2_desc: string;
  feature_3_title: string;
  feature_3_desc: string;
  steps_title: string;
  steps_subtitle: string;
  step_1_title: string;
  step_1_desc: string;
  step_2_title: string;
  step_2_desc: string;
  step_3_title: string;
  step_3_desc: string;
  step_4_title: string;
  step_4_desc: string;
  news_content: string;
  enable_topup: string;
  balance_text: string;
  dana_number: string;
  gopay_number: string;
  popup_enabled: string;
  popup_image: string;
  popup_link: string;
  popup_duration: string;
  popup_frequency: string;
  popup_closable: string;
  footer_logo_image: string;
  footer_logo_name: string;
  social_youtube: string;
  social_instagram: string;
  social_facebook: string;
  footer_layout_style: string;
  footer_location: string;
  privacy_policy_text: string;
  terms_of_service_text: string;
}

interface SettingsContextType {
  settings: Settings | null;
  refreshSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);

  const fetchSettings = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        if (data.favicon) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = data.favicon;
        }
        if (data.header_title) {
          document.title = data.header_title;
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
