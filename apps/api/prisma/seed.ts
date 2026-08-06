import {
  PrismaClient,
  TenantType,
  SiteType,
  SensorType,
  DeviceCategoryType,
  RiskFactorType,
  SystemCategory,
  SystemStatus,
  NotificationChannelType,
  ScheduledServiceType,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { DEFAULT_ROLE_KEYS, ROLE_LABELS_AR, type RoleKey } from "@marsad/shared";

// يتصل بدور قاعدة البيانات المرتفع الصلاحية (BYPASSRLS) عمدًا — هذا سكربت زرع
// بيانات إداري يُنشئ صفوفًا لعدة جهات ضمن عملية واحدة، وليس طلب تطبيق حي
// يجب أن يخضع لعزل RLS. راجع ARCHITECTURE.md لتفاصيل فصل الأدوار.
const prisma = new PrismaClient({
  datasourceUrl: process.env.MIGRATOR_DATABASE_URL ?? process.env.DATABASE_URL,
});

const DEMO_PASSWORD = "Marsad@2026";

interface TenantSeed {
  name: string;
  nameAr: string;
  type: TenantType;
  primaryColor: string;
  secondaryColor: string;
  slug: string;
  regions: [string, string];
  telecomProviders: string[];
}

const TENANTS: TenantSeed[] = [
  {
    name: "Digital Services Authority",
    nameAr: "الهيئة العامة للخدمات الرقمية",
    type: TenantType.GOVERNMENT,
    primaryColor: "#124C5C",
    secondaryColor: "#0B2430",
    slug: "gov",
    regions: ["المنطقة الوسطى", "المنطقة الشرقية"],
    telecomProviders: ["اتصالات الأولى", "شبكة نور", "الخط الوطني", "موجة الاتصالات"],
  },
  {
    name: "Al-Amal Specialist Hospital",
    nameAr: "مستشفى الأمل التخصصي",
    type: TenantType.HEALTHCARE,
    primaryColor: "#1F6B52",
    secondaryColor: "#0F3327",
    slug: "health",
    regions: ["مبنى العيادات", "مبنى الطوارئ"],
    telecomProviders: ["اتصالات الأولى", "شبكة نور", "الخط الوطني", "موجة الاتصالات"],
  },
  {
    name: "Nasij Technologies",
    nameAr: "شركة النسيج التقنية",
    type: TenantType.PRIVATE,
    primaryColor: "#8A5A2B",
    secondaryColor: "#3D2A15",
    slug: "corp",
    regions: ["المقر الرئيسي", "مركز البيانات"],
    telecomProviders: ["اتصالات الأولى", "شبكة نور", "الخط الوطني", "موجة الاتصالات"],
  },
];

const ROLE_EMAIL_LOCAL: Record<RoleKey, string> = {
  SUPER_ADMIN: "super-admin",
  TENANT_ADMIN: "tenant-admin",
  REGION_MANAGER: "region-manager",
  SUPPORT_ENGINEER: "support-engineer",
  OPERATIONS_CENTER: "operations-center",
  SITE_MANAGER: "site-manager",
  EMPLOYEE: "employee",
};

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function jitter(base: number, spread: number): number {
  return Math.round((base + (Math.random() - 0.5) * spread) * 10) / 10;
}

async function seedTenant(config: TenantSeed) {
  const tenant = await prisma.tenant.create({
    data: {
      name: config.name,
      nameAr: config.nameAr,
      type: config.type,
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      locale: "ar",
    },
  });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const roles = await Promise.all(
    DEFAULT_ROLE_KEYS.map((key) =>
      prisma.role.create({
        data: { tenantId: tenant.id, key, name: ROLE_LABELS_AR[key] },
      }),
    ),
  );
  const roleByKey = new Map(roles.map((r) => [r.key as RoleKey, r]));

  const regions = await Promise.all(
    config.regions.map((name) => prisma.region.create({ data: { tenantId: tenant.id, name } })),
  );

  const sites = await Promise.all(
    regions.flatMap((region, regionIndex) => [
      prisma.site.create({
        data: {
          tenantId: tenant.id,
          regionId: region.id,
          name: `${config.regions[regionIndex]} — المبنى الرئيسي`,
          type: SiteType.MAIN_BUILDING,
          latitude: 24.7 + Math.random() * 0.4,
          longitude: 46.6 + Math.random() * 0.4,
          infrastructureAgeYears: 5 + Math.floor(Math.random() * 8),
        },
      }),
      prisma.site.create({
        data: {
          tenantId: tenant.id,
          regionId: region.id,
          name: `${config.regions[regionIndex]} — الفرع`,
          type: SiteType.BRANCH,
          latitude: 24.7 + Math.random() * 0.4,
          longitude: 46.6 + Math.random() * 0.4,
          infrastructureAgeYears: 8 + Math.floor(Math.random() * 15),
        },
      }),
    ]),
  );

  const primarySite = sites[0];
  const primaryRegion = regions[0];

  for (const key of DEFAULT_ROLE_KEYS) {
    const role = roleByKey.get(key)!;
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        roleId: role.id,
        regionId: primaryRegion.id,
        siteId: primarySite.id,
        fullName: `${ROLE_LABELS_AR[key]} — ${config.nameAr}`,
        email: `${ROLE_EMAIL_LOCAL[key]}@${config.slug}.marsad.local`,
        passwordHash,
        phone: "0500000000",
      },
    });
  }

  const supportStaff = [
    { name: "أحمد الزهراني", role: "SUPPORT_ENGINEER" as RoleKey, status: "AVAILABLE" as const },
    { name: "فهد القحطاني", role: "SUPPORT_ENGINEER" as RoleKey, status: "BUSY" as const },
    { name: "منيرة العتيبي", role: "SUPPORT_ENGINEER" as RoleKey, status: "AVAILABLE" as const },
    { name: "سارة الدوسري", role: "OPERATIONS_CENTER" as RoleKey, status: "AVAILABLE" as const },
    { name: "خالد الشمري", role: "OPERATIONS_CENTER" as RoleKey, status: "UNAVAILABLE" as const },
  ];

  for (const [index, member] of supportStaff.entries()) {
    const role = roleByKey.get(member.role)!;
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        roleId: role.id,
        regionId: primaryRegion.id,
        siteId: primarySite.id,
        fullName: member.name,
        email: `staff${index + 1}@${config.slug}.marsad.local`,
        passwordHash,
        phone: "0500000000",
        availabilityStatus: member.status,
      },
    });
  }

  await Promise.all(
    [
      { name: "خادم تطبيقات داعم", category: SystemCategory.SERVER, status: SystemStatus.ACTIVE, loadPct: 62 },
      { name: "خادم قاعدة البيانات الرئيسي", category: SystemCategory.SERVER, status: SystemStatus.WARNING, loadPct: 84 },
      { name: "خادم النسخ الاحتياطي", category: SystemCategory.SERVER, status: SystemStatus.ACTIVE, loadPct: 35 },
      { name: "نظام إدارة الهوية", category: SystemCategory.MANAGEMENT_SYSTEM, status: SystemStatus.ACTIVE, loadPct: 48 },
      { name: "نظام إدارة التذاكر", category: SystemCategory.MANAGEMENT_SYSTEM, status: SystemStatus.ACTIVE, loadPct: 55 },
      { name: "الشبكة الداخلية (LAN)", category: SystemCategory.NETWORK, status: SystemStatus.ACTIVE, loadPct: 41 },
      { name: "جدار الحماية الرئيسي", category: SystemCategory.NETWORK, status: SystemStatus.DOWN, loadPct: 0 },
    ].map((s) => prisma.systemComponent.create({ data: { tenantId: tenant.id, ...s } })),
  );

  await Promise.all(
    [
      NotificationChannelType.PUSH,
      NotificationChannelType.EMAIL,
      NotificationChannelType.SMS,
      NotificationChannelType.WHATSAPP,
      NotificationChannelType.VOICE_CALL,
    ].map((type) =>
      prisma.notificationChannel.create({
        data: { tenantId: tenant.id, type, config: { provider: "mock" } },
      }),
    ),
  );

  const telecomProviders = await Promise.all(
    config.telecomProviders.map((name) => prisma.telecomProvider.create({ data: { tenantId: tenant.id, name } })),
  );

  for (const [siteIndex, site] of sites.entries()) {
    const tempSensor = await prisma.sensor.create({
      data: { siteId: site.id, type: SensorType.TEMPERATURE, unit: "°C" },
    });
    const humiditySensor = await prisma.sensor.create({
      data: { siteId: site.id, type: SensorType.HUMIDITY, unit: "%" },
    });
    const aqiSensor = await prisma.sensor.create({
      data: { siteId: site.id, type: SensorType.AQI, unit: "AQI" },
    });
    const co2Sensor = await prisma.sensor.create({
      data: { siteId: site.id, type: SensorType.CO2, unit: "ppm" },
    });
    const waterLeakSensor = await prisma.sensor.create({
      data: { siteId: site.id, type: SensorType.WATER_LEAK, unit: "dB" },
    });
    const lightSensor = await prisma.sensor.create({
      data: { siteId: site.id, type: SensorType.LIGHT, unit: "lux" },
    });

    const readingTimes: number[] = [];
    for (let h = 24; h >= 0; h -= 6) readingTimes.push(h);

    for (const h of readingTimes) {
      const recordedAt = hoursAgo(h);
      const isLatest = h === readingTimes[readingTimes.length - 1];

      await prisma.sensorReading.create({
        data: { sensorId: tempSensor.id, value: jitter(32, 8), recordedAt },
      });
      await prisma.sensorReading.create({
        data: { sensorId: humiditySensor.id, value: jitter(45, 15), recordedAt },
      });
      await prisma.sensorReading.create({
        data: { sensorId: aqiSensor.id, value: jitter(60, 20), recordedAt },
      });
      await prisma.sensorReading.create({
        data: {
          sensorId: co2Sensor.id,
          value: siteIndex === 2 ? jitter(1100, 200) : jitter(650, 200),
          recordedAt,
        },
      });
      await prisma.sensorReading.create({
        data: {
          sensorId: waterLeakSensor.id,
          value: siteIndex === 0 && isLatest ? jitter(72, 6) : 0,
          recordedAt,
        },
      });
      await prisma.sensorReading.create({
        data: { sensorId: lightSensor.id, value: jitter(320, 100), recordedAt },
      });

      await prisma.powerReading.create({
        data: {
          siteId: site.id,
          currentLoadKw: jitter(180, 40),
          maxCapacityKw: 250,
          generatorFuelPct: jitter(70, 20),
          upsChargePct: jitter(90, 10),
          voltage: jitter(220, 6),
          recordedAt,
        },
      });

      await prisma.weatherReading.create({
        data: {
          siteId: site.id,
          temperatureC: jitter(34, 10),
          humidityPct: jitter(40, 15),
          aqi: jitter(65, 25),
          recordedAt,
        },
      });

      for (const provider of telecomProviders) {
        await prisma.telecomStatusReading.create({
          data: {
            siteId: site.id,
            providerId: provider.id,
            latencyMs: jitter(35, 25),
            packetLossPct: Math.max(0, jitter(0.5, 1.2)),
            status: "متصل",
            recordedAt,
          },
        });
      }
    }

    await prisma.scheduledEvent.create({
      data: {
        siteId: site.id,
        name: "فعالية تشغيلية موسمية",
        expectedLoadImpactPct: jitter(12, 8),
        startAt: hoursAgo(-24),
        endAt: hoursAgo(-30),
      },
    });

    await prisma.riskFactor.create({
      data: {
        tenantId: tenant.id,
        siteId: site.id,
        factorType: RiskFactorType.ENVIRONMENTAL,
        weight: 0.3,
        score: jitter(45, 20),
      },
    });
    await prisma.riskFactor.create({
      data: {
        tenantId: tenant.id,
        siteId: site.id,
        factorType: RiskFactorType.INFRASTRUCTURE_AGE,
        weight: 0.2,
        score: jitter(35, 15),
      },
    });

    for (const category of [
      DeviceCategoryType.AC,
      DeviceCategoryType.LIGHTING,
      DeviceCategoryType.COMPUTERS,
    ]) {
      await prisma.deviceCategory.create({
        data: {
          tenantId: tenant.id,
          siteId: site.id,
          category,
          activeCount: 12,
          offCount: 3,
          scheduledCount: 5,
          consumptionKw: jitter(20, 8),
        },
      });
    }

    await prisma.rationingSchedule.create({
      data: {
        tenantId: tenant.id,
        siteId: site.id,
        name: "الترشيد الليلي",
        timeOfDay: "16:00",
        actionDescription: "إيقاف 50% من أجهزة التكييف تلقائيًا",
        expectedSavingsPct: 15,
      },
    });

    await prisma.energyConsumptionLog.create({
      data: { siteId: site.id, consumptionKw: jitter(150, 30), savingsKw: jitter(20, 8) },
    });

    const beneficiaries = [
      { name: "عبدالله المطيري", contact: "0551234567" },
      { name: "نورة الحربي", contact: "0567891234" },
      { name: "سلطان العنزي", contact: "0509876543" },
    ];
    const scheduledServiceSeeds: { type: ScheduledServiceType; hoursFromNow: number }[] = [
      { type: ScheduledServiceType.HEARING, hoursFromNow: siteIndex === 0 ? 4 : 30 },
      { type: ScheduledServiceType.APPOINTMENT, hoursFromNow: 18 },
      { type: ScheduledServiceType.TRANSACTION, hoursFromNow: 50 },
    ];
    for (const [idx, svc] of scheduledServiceSeeds.entries()) {
      const beneficiary = beneficiaries[idx % beneficiaries.length];
      await prisma.scheduledService.create({
        data: {
          tenantId: tenant.id,
          siteId: site.id,
          type: svc.type,
          scheduledAt: hoursAgo(-svc.hoursFromNow),
          beneficiaryContact: `${beneficiary.name} — ${beneficiary.contact}`,
        },
      });
    }
  }

  const prediction = await prisma.prediction.create({
    data: {
      tenantId: tenant.id,
      siteId: primarySite.id,
      title: "احتمال انقطاع كهربائي في المبنى الرئيسي",
      confidencePct: 78,
      rootCause: "ارتفاع الحمل الكهربائي مع انخفاض متزامن في شحن UPS خلال ساعات الذروة",
      windowStart: hoursAgo(-3),
      windowEnd: hoursAgo(-6),
    },
  });

  await prisma.predictionAction.create({
    data: {
      predictionId: prediction.id,
      description: "تفعيل المولد الاحتياطي مسبقًا والتحقق من مستوى الوقود",
      assignedRoleKey: "SUPPORT_ENGINEER",
      status: "PENDING",
    },
  });
  await prisma.predictionAction.create({
    data: {
      predictionId: prediction.id,
      description: "إشعار مركز العمليات لمتابعة الحمل الكهربائي لحظيًا",
      assignedRoleKey: "OPERATIONS_CENTER",
      status: "IN_PROGRESS",
    },
  });

  await prisma.alert.create({
    data: {
      tenantId: tenant.id,
      siteId: primarySite.id,
      category: "POWER",
      severity: "CRITICAL",
      title: "حمل كهربائي مرتفع — المبنى الرئيسي",
      description: "تجاوز الحمل الكهربائي 85% من السعة القصوى للموقع",
    },
  });

  await prisma.escalationRule.create({
    data: {
      tenantId: tenant.id,
      level: 1,
      delayMinutes: 0,
      notifyRoles: ["SUPPORT_ENGINEER", "OPERATIONS_CENTER"],
    },
  });
  await prisma.escalationRule.create({
    data: {
      tenantId: tenant.id,
      level: 2,
      delayMinutes: 5,
      notifyRoles: ["SITE_MANAGER"],
    },
  });
  await prisma.escalationRule.create({
    data: {
      tenantId: tenant.id,
      level: 3,
      delayMinutes: 20,
      notifyRoles: ["TENANT_ADMIN"],
    },
  });

  return tenant;
}

async function main() {
  console.log("حذف البيانات القديمة...");
  await prisma.tenant.deleteMany();

  for (const config of TENANTS) {
    console.log(`زرع بيانات الجهة: ${config.nameAr}`);
    await seedTenant(config);
  }

  console.log("\nتم بنجاح. بيانات الدخول التجريبية (كلمة المرور لكل الحسابات):", DEMO_PASSWORD);
  for (const config of TENANTS) {
    console.log(`  ${config.nameAr}: tenant-admin@${config.slug}.marsad.local`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
