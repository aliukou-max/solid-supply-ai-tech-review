import type { ProductType } from "../product/types";

interface ComponentTemplate {
  name: string;
  technicalNotes?: string;
  assemblyNotes?: string;
}

const COMPONENT_TEMPLATES: Record<ProductType, ComponentTemplate[]> = {
  Stalas: [
    { name: "Stalviršis", technicalNotes: "Patikrinti matmenis ir apdailą", assemblyNotes: "Tvirtinti prie kojų konstrukcijos" },
    { name: "Kojos", technicalNotes: "Patikrinti stabilumą ir išlyginimą", assemblyNotes: "Užtikrinti tvirtą jungimą" },
    { name: "Rėmas/Konstrukcija", technicalNotes: "Patikrinti suvirinimo kokybę", assemblyNotes: "Surinkti pagal brėžinį" },
  ],
  Backwall: [
    { name: "Rėmas", technicalNotes: "Patikrinti kampų statumą", assemblyNotes: "Tvirtinti prie sienos" },
    { name: "Paviršius/Plytelės", technicalNotes: "Patikrinti apdailos kokybę", assemblyNotes: "Klijavimas pagal brėžinį" },
    { name: "Apšvietimas", technicalNotes: "Patikrinti LED specifikaciją", assemblyNotes: "Integruoti į rėmą" },
  ],
  Lightbox: [
    { name: "Korpusas", technicalNotes: "Patikrinti uždarumo kokybę", assemblyNotes: "Surinkti prieš integruojant apšvietimą" },
    { name: "LED sistema", technicalNotes: "Patikrinti voltažą ir spalvą", assemblyNotes: "Tvirtinti vienodais tarpais" },
    { name: "Difuzorius", technicalNotes: "Patikrinti šviesos pasiskirstymą", assemblyNotes: "Tvirtinti paskutiniu etapu" },
    { name: "Grafika", technicalNotes: "Patikrinti spaudos kokybę", assemblyNotes: "Įdėti po difuzoriumi" },
  ],
  Lentyna: [
    { name: "Lentynos plokštė", technicalNotes: "Patikrinti storį ir apdailą", assemblyNotes: "Tvirtinti prie laikiklių" },
    { name: "Laikikliai/Konsolės", technicalNotes: "Patikrinti laikomumo stiprumą", assemblyNotes: "Tvirtinti prie sienos" },
    { name: "Galinė sienelė", technicalNotes: "Patikrinti apdailos kokybę", assemblyNotes: "Tvirtinti prie lentynų" },
  ],
  Vitrina: [
    { name: "Rėmas", technicalNotes: "Patikrinti konstrukcijos stabilumą", assemblyNotes: "Surinkti pagal brėžinį" },
    { name: "Stiklas", technicalNotes: "Patikrinti storio ir skaidrumo specifikaciją", assemblyNotes: "Įstatyti su tarpikliais" },
    { name: "Durys", technicalNotes: "Patikrinti vyrių ir užraktų kokybę", assemblyNotes: "Sumontuoti paskutinėmis" },
    { name: "Lentynos", technicalNotes: "Patikrinti aukščio reguliavimo sistemą", assemblyNotes: "Įdėti po stiklo montavimo" },
  ],
  Kita: [
    { name: "Pagrindinė konstrukcija", technicalNotes: "Apibrėžti technines specifikacijas", assemblyNotes: "Apibrėžti montavimo seką" },
  ],
};

export function getComponentTemplates(productType: ProductType): ComponentTemplate[] {
  return COMPONENT_TEMPLATES[productType] || COMPONENT_TEMPLATES.Kita;
}
