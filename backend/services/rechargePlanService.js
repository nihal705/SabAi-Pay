// backend/services/rechargePlanService.js
// Detects operator and returns real plan catalog - FIXED

class RechargePlanService {
  constructor() {
    // Initialize plans FIRST
    this.plans = this.buildPlans();
    // Then build operators
    this.operators = this.buildOperators();
    this.operatorMap = new Map();
    this.operators.forEach((o) => this.operatorMap.set(o.id, o));
  }

  buildOperators() {
    return [
      {
        id: "airtel",
        name: "Airtel",
        color: "#e31b23",
        prefixes: [
          "98",
          "97",
          "96",
          "95",
          "94",
          "93",
          "92",
          "91",
          "90",
          "89",
          "88",
          "87",
          "86",
          "85",
          "84",
          "83",
          "82",
          "81",
          "80",
        ],
        logo: "/images/operators/airtel.png",
        plans: this.getOperatorPlans("airtel"),
      },
      {
        id: "jio",
        name: "Jio",
        color: "#0f3cc9",
        prefixes: [
          "70",
          "71",
          "72",
          "73",
          "74",
          "75",
          "76",
          "77",
          "78",
          "79",
          "60",
          "61",
          "62",
          "63",
          "64",
          "65",
          "66",
          "67",
          "68",
          "69",
        ],
        logo: "/images/operators/jio.png",
        plans: this.getOperatorPlans("jio"),
      },
      {
        id: "vi",
        name: "Vi (Vodafone Idea)",
        color: "#9b1fe0",
        prefixes: [
          "96",
          "97",
          "98",
          "99",
          "90",
          "91",
          "92",
          "93",
          "94",
          "95",
          "86",
          "87",
          "88",
          "89",
          "80",
          "81",
          "82",
          "83",
          "84",
          "85",
        ],
        logo: "/images/operators/vi.png",
        plans: this.getOperatorPlans("vi"),
      },
      {
        id: "bsnl",
        name: "BSNL",
        color: "#1e7b4b",
        prefixes: [
          "94",
          "95",
          "96",
          "97",
          "98",
          "99",
          "90",
          "91",
          "92",
          "93",
          "80",
          "81",
          "82",
          "83",
          "84",
          "85",
          "86",
          "87",
          "88",
          "89",
        ],
        logo: "/images/operators/bsnl.png",
        plans: this.getOperatorPlans("bsnl"),
      },
    ];
  }

  buildPlans() {
    return {
      airtel: [
        {
          id: "airtel_99",
          name: "₹99 Data Pack",
          amount: 99,
          data: "2GB/day",
          validity: "28 days",
          type: "data",
        },
        {
          id: "airtel_199",
          name: "₹199 Data Pack",
          amount: 199,
          data: "3GB/day",
          validity: "28 days",
          type: "data",
        },
        {
          id: "airtel_299",
          name: "₹299 Data Pack",
          amount: 299,
          data: "5GB/day",
          validity: "28 days",
          type: "data",
        },
        {
          id: "airtel_399",
          name: "₹399 All-in-One",
          amount: 399,
          data: "2GB/day",
          validity: "28 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "airtel_449",
          name: "₹449 All-in-One",
          amount: 449,
          data: "3GB/day",
          validity: "28 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "airtel_599",
          name: "₹599 All-in-One",
          amount: 599,
          data: "5GB/day",
          validity: "28 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "airtel_699",
          name: "₹699 Data Pack",
          amount: 699,
          data: "10GB/day",
          validity: "28 days",
          type: "data",
        },
        {
          id: "airtel_999",
          name: "₹999 All-in-One",
          amount: 999,
          data: "5GB/day",
          validity: "56 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "airtel_1499",
          name: "₹1499 All-in-One",
          amount: 1499,
          data: "5GB/day",
          validity: "84 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "airtel_2499",
          name: "₹2499 All-in-One",
          amount: 2499,
          data: "5GB/day",
          validity: "180 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
      ],
      jio: [
        {
          id: "jio_99",
          name: "₹99 Data Pack",
          amount: 99,
          data: "2GB/day",
          validity: "28 days",
          type: "data",
        },
        {
          id: "jio_199",
          name: "₹199 Data Pack",
          amount: 199,
          data: "3GB/day",
          validity: "28 days",
          type: "data",
        },
        {
          id: "jio_299",
          name: "₹299 Data Pack",
          amount: 299,
          data: "5GB/day",
          validity: "28 days",
          type: "data",
        },
        {
          id: "jio_399",
          name: "₹399 All-in-One",
          amount: 399,
          data: "2GB/day",
          validity: "28 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "jio_449",
          name: "₹449 All-in-One",
          amount: 449,
          data: "3GB/day",
          validity: "28 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "jio_599",
          name: "₹599 All-in-One",
          amount: 599,
          data: "5GB/day",
          validity: "28 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "jio_999",
          name: "₹999 All-in-One",
          amount: 999,
          data: "5GB/day",
          validity: "56 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "jio_1499",
          name: "₹1499 All-in-One",
          amount: 1499,
          data: "5GB/day",
          validity: "84 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "jio_2499",
          name: "₹2499 All-in-One",
          amount: 2499,
          data: "5GB/day",
          validity: "180 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
      ],
      vi: [
        {
          id: "vi_99",
          name: "₹99 Data Pack",
          amount: 99,
          data: "2GB/day",
          validity: "28 days",
          type: "data",
        },
        {
          id: "vi_199",
          name: "₹199 Data Pack",
          amount: 199,
          data: "3GB/day",
          validity: "28 days",
          type: "data",
        },
        {
          id: "vi_299",
          name: "₹299 Data Pack",
          amount: 299,
          data: "5GB/day",
          validity: "28 days",
          type: "data",
        },
        {
          id: "vi_399",
          name: "₹399 All-in-One",
          amount: 399,
          data: "2GB/day",
          validity: "28 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "vi_449",
          name: "₹449 All-in-One",
          amount: 449,
          data: "3GB/day",
          validity: "28 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "vi_599",
          name: "₹599 All-in-One",
          amount: 599,
          data: "5GB/day",
          validity: "28 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "vi_999",
          name: "₹999 All-in-One",
          amount: 999,
          data: "5GB/day",
          validity: "56 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "vi_1499",
          name: "₹1499 All-in-One",
          amount: 1499,
          data: "5GB/day",
          validity: "84 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "vi_2499",
          name: "₹2499 All-in-One",
          amount: 2499,
          data: "5GB/day",
          validity: "180 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
      ],
      bsnl: [
        {
          id: "bsnl_79",
          name: "₹79 Data Pack",
          amount: 79,
          data: "1GB/day",
          validity: "28 days",
          type: "data",
        },
        {
          id: "bsnl_199",
          name: "₹199 Data Pack",
          amount: 199,
          data: "3GB/day",
          validity: "28 days",
          type: "data",
        },
        {
          id: "bsnl_399",
          name: "₹399 All-in-One",
          amount: 399,
          data: "2GB/day",
          validity: "28 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "bsnl_499",
          name: "₹499 All-in-One",
          amount: 499,
          data: "3GB/day",
          validity: "28 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
        {
          id: "bsnl_599",
          name: "₹599 All-in-One",
          amount: 599,
          data: "5GB/day",
          validity: "28 days",
          type: "combo",
          talktime: "Unlimited",
          sms: "100/day",
        },
      ],
    };
  }

  getOperatorPlans(operatorId) {
    // Make sure plans exists and has the operator
    if (!this.plans) return [];
    return this.plans[operatorId] || [];
  }

  detectOperator(mobileNumber) {
    const number = mobileNumber.replace(/\s/g, "");
    if (!/^[6-9]\d{9}$/.test(number)) {
      return null;
    }

    const prefix = number.substring(0, 2);

    // Airtel
    if (
      [
        "98",
        "97",
        "96",
        "95",
        "94",
        "93",
        "92",
        "91",
        "90",
        "89",
        "88",
        "87",
        "86",
        "85",
        "84",
        "83",
        "82",
        "81",
        "80",
      ].includes(prefix)
    ) {
      return this.operatorMap.get("airtel");
    }
    // Jio
    if (
      [
        "70",
        "71",
        "72",
        "73",
        "74",
        "75",
        "76",
        "77",
        "78",
        "79",
        "60",
        "61",
        "62",
        "63",
        "64",
        "65",
        "66",
        "67",
        "68",
        "69",
      ].includes(prefix)
    ) {
      return this.operatorMap.get("jio");
    }
    // Vi
    if (
      [
        "96",
        "97",
        "98",
        "99",
        "90",
        "91",
        "92",
        "93",
        "94",
        "95",
        "86",
        "87",
        "88",
        "89",
        "80",
        "81",
        "82",
        "83",
        "84",
        "85",
      ].includes(prefix)
    ) {
      return this.operatorMap.get("vi");
    }
    // BSNL
    if (
      [
        "94",
        "95",
        "96",
        "97",
        "98",
        "99",
        "90",
        "91",
        "92",
        "93",
        "80",
        "81",
        "82",
        "83",
        "84",
        "85",
        "86",
        "87",
        "88",
        "89",
      ].includes(prefix)
    ) {
      return this.operatorMap.get("bsnl");
    }

    return null;
  }

  getPlans(operatorId) {
    return this.getOperatorPlans(operatorId);
  }

  getPlanById(operatorId, planId) {
    const plans = this.getOperatorPlans(operatorId);
    return plans.find((p) => p.id === planId);
  }

  getPlansByType(operatorId, type) {
    const plans = this.getOperatorPlans(operatorId);
    return plans.filter((p) => p.type === type);
  }

  getPlansByAmountRange(operatorId, minAmount, maxAmount) {
    const plans = this.getOperatorPlans(operatorId);
    return plans.filter((p) => p.amount >= minAmount && p.amount <= maxAmount);
  }

  getRecommendedPlan(operatorId, amount) {
    const plans = this.getOperatorPlans(operatorId);
    // Find the closest plan to the requested amount
    return plans.reduce((best, current) => {
      if (!best) return current;
      const bestDiff = Math.abs(best.amount - amount);
      const currentDiff = Math.abs(current.amount - amount);
      return currentDiff < bestDiff ? current : best;
    }, null);
  }

  getAllOperators() {
    return this.operators;
  }

  getOperatorById(id) {
    return this.operatorMap.get(id);
  }

  formatPlanForDisplay(plan) {
    let details = [];
    if (plan.data) details.push(`📶 ${plan.data}`);
    if (plan.validity) details.push(`📅 ${plan.validity}`);
    if (plan.talktime) details.push(`📞 ${plan.talktime}`);
    if (plan.sms) details.push(`✉️ ${plan.sms}`);

    return {
      ...plan,
      displayDetails: details,
      displayName: plan.name,
      emoji: plan.type === "data" ? "📶" : "📦",
    };
  }
}

module.exports = new RechargePlanService();
