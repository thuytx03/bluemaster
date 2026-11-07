import type { StatusBgCategory } from "src/modules/automation/types/post-campaign.types"

type TFunction = (
  key: string,
  params?: Record<string, string | number>
) => string

/**
 * Built-in Facebook status backgrounds (text_format_preset ids), used until the
 * live list from `fetchStatusBackgrounds` arrives. Data ported verbatim from
 * xthuy-social `post-campaign/status-backgrounds.ts`.
 */
export function getStatusBgCategories(t: TFunction): StatusBgCategory[] {
  return [
    {
      name: t("campaign_manager_status_bg_category_solid"),
      presets: [
        {
          id: "1038184293978413",
          desc: t("campaign_manager_status_bg_desc_light_gray"),
          bgColor: "#EFEFEF",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#828282",
          thumbUrl: null
        },
        {
          id: "340531735020539",
          desc: t("campaign_manager_status_bg_desc_gray"),
          bgColor: "#A3A3A3",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#525252",
          thumbUrl: null
        },
        {
          id: "334764089044169",
          desc: t("campaign_manager_status_bg_desc_black"),
          bgColor: "#1C1C1C",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#F5F5F5",
          thumbUrl: null
        },
        {
          id: "3121716424802062",
          desc: t("campaign_manager_status_bg_desc_pink"),
          bgColor: "#FFC4BB",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#E11731",
          thumbUrl: null
        },
        {
          id: "3625555494348449",
          desc: t("campaign_manager_status_bg_desc_red"),
          bgColor: "#FA2E3E",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#611316",
          thumbUrl: null
        },
        {
          id: "841428021039542",
          desc: t("campaign_manager_status_bg_desc_deep_red"),
          bgColor: "#920E1D",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#FF7C74",
          thumbUrl: null
        },
        {
          id: "838428734606379",
          desc: t("campaign_manager_status_bg_desc_pink"),
          bgColor: "#FF90BD",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#B9005F",
          thumbUrl: null
        },
        {
          id: "1354917475430263",
          desc: t("campaign_manager_status_bg_desc_pink"),
          bgColor: "#F72186",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#5F1032",
          thumbUrl: null
        },
        {
          id: "287628994046344",
          desc: t("campaign_manager_status_bg_desc_dark_red"),
          bgColor: "#B9005F",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#FF90BD",
          thumbUrl: null
        },
        {
          id: "866176818274367",
          desc: t("campaign_manager_status_bg_desc_beige"),
          bgColor: "#FFC891",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#B15B0F",
          thumbUrl: null
        },
        {
          id: "653263790240452",
          desc: t("campaign_manager_status_bg_desc_orange"),
          bgColor: "#F68628",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#7F420E",
          thumbUrl: null
        },
        {
          id: "618237107054113",
          desc: t("campaign_manager_status_bg_desc_brown"),
          bgColor: "#B15B0F",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#FFC891",
          thumbUrl: null
        },
        {
          id: "2046306532386635",
          desc: t("campaign_manager_status_bg_desc_light_yellow"),
          bgColor: "#FFF287",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#9D8000",
          thumbUrl: null
        },
        {
          id: "184083004658498",
          desc: t("campaign_manager_status_bg_desc_yellow"),
          bgColor: "#F9CF00",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#887000",
          thumbUrl: null
        },
        {
          id: "696971568609418",
          desc: t("campaign_manager_status_bg_desc_deep_yellow"),
          bgColor: "#C3A000",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#625008",
          thumbUrl: null
        },
        {
          id: "861160898741935",
          desc: t("campaign_manager_status_bg_desc_light_green"),
          bgColor: "#F4FFD1",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#678F16",
          thumbUrl: null
        },
        {
          id: "784913000073648",
          desc: t("campaign_manager_status_bg_desc_light_green"),
          bgColor: "#AAE534",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#5A7C16",
          thumbUrl: null
        },
        {
          id: "680142694061655",
          desc: t("campaign_manager_status_bg_desc_olive"),
          bgColor: "#678F16",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#D1FF71",
          thumbUrl: null
        },
        {
          id: "1142122703434463",
          desc: t("campaign_manager_status_bg_desc_light_green"),
          bgColor: "#D5F7D0",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#299633",
          thumbUrl: null
        },
        {
          id: "1032899107855087",
          desc: t("campaign_manager_status_bg_desc_green"),
          bgColor: "#51CA55",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#206C25",
          thumbUrl: null
        },
        {
          id: "345064321202371",
          desc: t("campaign_manager_status_bg_desc_green"),
          bgColor: "#24832C",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#90E78A",
          thumbUrl: null
        },
        {
          id: "137309512798730",
          desc: t("campaign_manager_status_bg_desc_light_blue"),
          bgColor: "#D8F5EB",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#009478",
          thumbUrl: null
        },
        {
          id: "685611216963500",
          desc: t("campaign_manager_status_bg_desc_teal"),
          bgColor: "#3EC7A7",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#006A56",
          thumbUrl: null
        },
        {
          id: "991525518807930",
          desc: t("campaign_manager_status_bg_desc_green"),
          bgColor: "#008168",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#8FE2CA",
          thumbUrl: null
        },
        {
          id: "1342634519948064",
          desc: t("campaign_manager_status_bg_desc_light_blue"),
          bgColor: "#9CDBFF",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#0078B5",
          thumbUrl: null
        },
        {
          id: "2032408867140667",
          desc: t("campaign_manager_status_bg_desc_light_blue"),
          bgColor: "#00ADFC",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#074C72",
          thumbUrl: null
        },
        {
          id: "3543708749174422",
          desc: t("campaign_manager_status_bg_desc_silver_blue"),
          bgColor: "#005783",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#42BDFF",
          thumbUrl: null
        },
        {
          id: "1798961300535344",
          desc: t("campaign_manager_status_bg_desc_light_purple"),
          bgColor: "#D9CBFF",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#6760E4",
          thumbUrl: null
        },
        {
          id: "646971224215411",
          desc: t("campaign_manager_status_bg_desc_purple"),
          bgColor: "#7970FB",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#F2ECFF",
          thumbUrl: null
        },
        {
          id: "1502418263945319",
          desc: t("campaign_manager_status_bg_desc_deep_purple"),
          bgColor: "#4944A8",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#B7A7FF",
          thumbUrl: null
        },
        {
          id: "309187638478389",
          desc: t("campaign_manager_status_bg_desc_pink"),
          bgColor: "#FFBCFD",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#B93EB0",
          thumbUrl: null
        },
        {
          id: "284033164441257",
          desc: t("campaign_manager_status_bg_desc_light_purple"),
          bgColor: "#E559DA",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#60245B",
          thumbUrl: null
        },
        {
          id: "352064377250020",
          desc: t("campaign_manager_status_bg_desc_solid_dark_purple"),
          bgColor: "#912C87",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#FCE3FA",
          thumbUrl: null
        }
      ]
    },
    {
      name: t("campaign_manager_status_bg_category_gradient"),
      presets: [
        {
          id: "1531491134287540",
          desc: t("campaign_manager_status_bg_desc_gradient_pink_orange"),
          bgColor: "#EC99A3",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#6C2666",
          thumbUrl: null
        },
        {
          id: "299890096121791",
          desc: t("campaign_manager_status_bg_desc_pink"),
          bgColor: "#E4B7C6",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#3C3887",
          thumbUrl: null
        },
        {
          id: "1452114928969476",
          desc: t("campaign_manager_status_bg_desc_gradient_orange_yellow"),
          bgColor: "#E2B284",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#611316",
          thumbUrl: null
        },
        {
          id: "149887694868218",
          desc: t("campaign_manager_status_bg_desc_gradient_red_purple"),
          bgColor: "#99526C",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#FFFFFF",
          thumbUrl: null
        },
        {
          id: "681225170735955",
          desc: t("campaign_manager_status_bg_desc_gradient_blue_purple"),
          bgColor: "#95A3E4",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#000000",
          thumbUrl: null
        },
        {
          id: "1012699409936684",
          desc: t("campaign_manager_status_bg_desc_gradient_yellow_orange"),
          bgColor: "#F5BC75",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#920E1D",
          thumbUrl: null
        },
        {
          id: "844319284091919",
          desc: t("campaign_manager_status_bg_desc_gradient_pink_purple"),
          bgColor: "#9C7FB4",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#000000",
          thumbUrl: null
        },
        {
          id: "639000325036183",
          desc: t("campaign_manager_status_bg_desc_gradient_pink_orange"),
          bgColor: "#EA80B3",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#413C93",
          thumbUrl: null
        }
      ]
    },
    {
      name: t("campaign_manager_status_bg_category_decorative"),
      presets: [
        {
          id: "1007203310607963",
          desc: t("campaign_manager_status_bg_desc_light_purple"),
          bgColor: "#DFD6F7",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#4944A8",
          thumbUrl: null
        },
        {
          id: "6524876100975152",
          desc: t("campaign_manager_status_bg_desc_light_purple"),
          bgColor: "#8395D1",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#FFFFFF",
          thumbUrl: null
        },
        {
          id: "352226107216239",
          desc: t("campaign_manager_status_bg_desc_beige"),
          bgColor: "#DDBFAE",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#635C56",
          thumbUrl: null
        },
        {
          id: "1718609505251057",
          desc: t("campaign_manager_status_bg_desc_light_pink"),
          bgColor: "#B45E73",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#FFFFFF",
          thumbUrl: null
        },
        {
          id: "710893630898745",
          desc: t("campaign_manager_status_bg_desc_black_dunes"),
          bgColor: "#18243B",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#FFFFFF",
          thumbUrl: null
        },
        {
          id: "698363068460805",
          desc: t("campaign_manager_status_bg_desc_gray"),
          bgColor: "#C2C9CA",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#595959",
          thumbUrl: null
        },
        {
          id: "676677941094852",
          desc: t("campaign_manager_status_bg_desc_pink"),
          bgColor: "#D6A7B5",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#000000",
          thumbUrl: null
        },
        {
          id: "243340214990392",
          desc: t("campaign_manager_status_bg_desc_red"),
          bgColor: "#D83A4E",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#FFE8F0",
          thumbUrl: null
        },
        {
          id: "650785203544528",
          desc: t("campaign_manager_status_bg_desc_light_green"),
          bgColor: "#BDE631",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#086210",
          thumbUrl: null
        },
        {
          id: "231438476584844",
          desc: t("campaign_manager_status_bg_desc_white"),
          bgColor: "#FFF5EB",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#525252",
          thumbUrl: null
        },
        {
          id: "1655172555010455",
          desc: t("campaign_manager_status_bg_desc_light_purple"),
          bgColor: "#C4C8F8",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#534EBF",
          thumbUrl: null
        },
        {
          id: "1953054055059680",
          desc: t("campaign_manager_status_bg_desc_light_blue"),
          bgColor: "#C6F0E4",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#009478",
          thumbUrl: null
        },
        {
          id: "1369831517263092",
          desc: t("campaign_manager_status_bg_desc_yellow"),
          bgColor: "#FEC518",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#705C04",
          thumbUrl: null
        },
        {
          id: "820220726468391",
          desc: t("campaign_manager_status_bg_desc_red"),
          bgColor: "#421826",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#FFFFFF",
          thumbUrl: null
        },
        {
          id: "992723408700211",
          desc: t("campaign_manager_status_bg_desc_light_purple"),
          bgColor: "#BA95C2",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#000000",
          thumbUrl: null
        },
        {
          id: "328761036360061",
          desc: t("campaign_manager_status_bg_desc_sparkle_light_purple"),
          bgColor: "#F3EBFF",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#7970FB",
          thumbUrl: null
        },
        {
          id: "861250769045725",
          desc: t("campaign_manager_status_bg_desc_hazy_red_heart"),
          bgColor: "#FA6F6D",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#422828",
          thumbUrl: null
        },
        {
          id: "847821360169458",
          desc: t("campaign_manager_status_bg_desc_orange_confetti"),
          bgColor: "#FCB144",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#4B3686",
          thumbUrl: null
        },
        {
          id: "233245916398282",
          desc: t("campaign_manager_status_bg_desc_abstract_beige_heart"),
          bgColor: "#E4D2D4",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#802A2A",
          thumbUrl: null
        },
        {
          id: "732044718735090",
          desc: t("campaign_manager_status_bg_desc_crimson"),
          bgColor: "#C1157F",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#FFFFFF",
          thumbUrl: null
        },
        {
          id: "1690448544763812",
          desc: t("campaign_manager_status_bg_desc_pink_purple_waves"),
          bgColor: "#DBDFFD",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#44489E",
          thumbUrl: null
        },
        {
          id: "1723026288124782",
          desc: t("campaign_manager_status_bg_desc_light_blue"),
          bgColor: "#ACE2F7",
          gradColor: null,
          gradDir: null,
          imgUrl: null,
          textColor: "#274C82",
          thumbUrl: null
        }
      ]
    }
  ]
}
