var db_cluster = '${settings.galera}' == 'true' ? "galera" : "master";
var db_count = '${settings.galera}' == 'true' ? 3 : 2;

var resp = {
  result: 0,
  ssl: !!jelastic.billing.account.GetQuotas('environment.jelasticssl.enabled').array[0].value,
  nodes: []
}

if ('${settings.glusterfs:false}' == 'true') {
  resp.nodes.push({
    nodeType: "storage",
    count: 3,
    cluster: true,
    flexibleCloudlets: ${settings.st_flexibleCloudlets:8},
    fixedCloudlets: ${settings.st_fixedCloudlets:1},
    nodeGroup: "storage",
    restartDelay: 10,
    isRedeploySupport: false,
    validation: {
      minCount: 3,
      maxCount: 3
    }
  })
} else {
  resp.nodes.push({
    nodeType: "storage",
    count: 1,
    flexibleCloudlets: ${settings.st_flexibleCloudlets:8},
    fixedCloudlets: ${settings.st_fixedCloudlets:1},
    nodeGroup: "storage",
    isRedeploySupport: false,
    validation: {
      minCount: 1,
      maxCount: 1
    }
  })
}

resp.nodes.push({
  nodeType: "mariadb-dockerized",
  flexibleCloudlets: ${settings.db_flexibleCloudlets:16},
  fixedCloudlets: ${settings.db_fixedCloudlets:1},
  count: db_count,
  nodeGroup: "sqldb",
  restartDelay: 10,
  skipNodeEmails: true,
  validation: {
    minCount: db_count,
    maxCount: db_count
  },
  cluster: {
    scheme: db_cluster,
    db_user: "${globals.DB_USER}",
    db_pass: "${globals.DB_PASS}",
    is_proxysql: false,
    custom_conf: "${baseUrl}/configs/sqldb/wordpress.cnf"
  },
  env: {
    SCHEME: db_cluster,
    DB_USER: "${globals.DB_USER}",
    DB_PASS: "${globals.DB_PASS}",
    IS_PROXYSQL: false
  }  
});

if ('${settings.ls_addon:false}'== 'true') {
  resp.nodes.push({
    nodeType: "litespeedadc",
    count: ${settings.bl_count:2},
    flexibleCloudlets: ${settings.bl_flexibleCloudlets:8},
    fixedCloudlets: ${settings.bl_fixedCloudlets:1},
    nodeGroup: "bl",
    restartDelay: 10,
    scalingMode: "STATEFUL",
    addons: ["setup-site-url"],
    env: {
      WP_PROTECT: "OFF",
      WP_PROTECT_LIMIT: 100
    }
  }, {
    nodeType: "litespeedphp",
    count: ${settings.cp_count:2},
    engine: "php7.4",
    flexibleCloudlets: ${settings.cp_flexibleCloudlets:16},
    fixedCloudlets: ${settings.cp_fixedCloudlets:1},
    nodeGroup: "cp",
    restartDelay: 10,
    scalingMode: "STATELESS",
    addons: ["setup-site-url"],
    env: {
      SERVER_WEBROOT: "/var/www/webroot/ROOT",
      REDIS_ENABLED: "true",
      WAF: "${settings.waf:false}",
      WP_PROTECT: "OFF"
    }
  })
} else {
  resp.nodes.push({
    nodeType: "nginx",
    count: ${settings.bl_count:2},
    flexibleCloudlets: ${settings.bl_flexibleCloudlets:8},
    fixedCloudlets: ${settings.bl_fixedCloudlets:1},
    nodeGroup: "bl",
    restartDelay: 10,
    addons: ["setup-site-url"],
    scalingMode: "STATEFUL"
  }, {
    nodeType: "nginxphp",
    count: ${settings.cp_count:2},
    engine: "php7.4",
    flexibleCloudlets: ${settings.cp_flexibleCloudlets:8},                  
    fixedCloudlets: ${settings.cp_fixedCloudlets:1},
    nodeGroup: "cp",
    restartDelay: 10,
    scalingMode: "STATELESS",
    addons: ["setup-site-url"],
    env: {
      SERVER_WEBROOT: "/var/www/webroot/ROOT",
      REDIS_ENABLED: "true"
    }
  })
}

return resp;
