// preflight-check.js

function verifyTestHarnessNeutrality() {
  const backendFlag = process.env.TEST_MODE;
  const frontendFlag = process.env.NEXT_PUBLIC_TEST_MODE;

  console.log("🔍 PREFLIGHT HARNESS CHECK:");
  console.log(`- TEST_MODE: ${backendFlag}`);
  console.log(`- NEXT_PUBLIC_TEST_MODE: ${frontendFlag}`);

  const testModeActive = (backendFlag === 'true');
  const frontendModeActive = (frontendFlag === 'true');

  if (testModeActive || frontendModeActive) {
    console.error("❌ HARNESS ACTIVE — Cannot proceed with baseline test run.");
    process.exit(1);
  } else {
    console.log("✅ Harness Neutralized: Environment is safe for Phase 17D baseline test runs.");
  }
}

verifyTestHarnessNeutrality(); 