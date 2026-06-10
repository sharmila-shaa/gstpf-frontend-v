<script setup>
import { computed, onMounted, ref, watch } from "vue";
import api from "../services/api";

const name = ref("");
const selectedState = ref("");
const selectedDistrict = ref("");
const pincode = ref("");
const mobile = ref("");

const states = ref([]);
const districts = ref([]);
const results = ref([]);

const loading = ref(false);
const locationLoading = ref(false);
const error = ref("");
const searched = ref(false);

const page = ref(1);
const limit = ref(50);
const totalRecords = ref(0);
const totalPages = ref(1);

const hasResults = computed(() => results.value.length > 0);

function getValue(record, keys, fallback = "-") {
  for (const key of keys) {
    const value = record?.[key];

    if (value !== undefined && value !== null) {
      const text = String(value).trim();

      if (text) {
        return text;
      }
    }
  }

  return fallback;
}

function getAddress(record) {
  if (typeof record?.address === "string" && record.address.trim()) {
    return record.address.trim();
  }

  if (typeof record?.adr === "string" && record.adr.trim()) {
    return record.adr.trim();
  }

  const address = record?.adrs;

  if (address && typeof address === "object") {
    return [
      address.bno,
      address.flno,
      address.bnm,
      address.st,
      address.loc,
      address.city,
      address.dst,
      address.stcd,
      address.pinCode
    ]
      .filter(Boolean)
      .join(", ");
  }

  return "-";
}

function getPincode(record) {
  return getValue(
    record,
    [
      "pincode",
      "pinCode",
      "pinCd",
      "pnCd"
    ],
    record?.adrs?.pinCode || pincode.value || "-"
  );
}

async function loadStates() {
  try {
    const response = await api.get("/api/locations/states");

    states.value =
      response.data?.data ||
      response.data?.states ||
      [];
  } catch (requestError) {
    console.error("Unable to load states:", requestError);
  }
}

async function loadDistricts() {
  selectedDistrict.value = "";
  districts.value = [];

  if (!selectedState.value) {
    return;
  }

  locationLoading.value = true;

  try {
    const response = await api.get("/api/locations/districts", {
      params: {
        state: selectedState.value
      }
    });

    districts.value =
      response.data?.data ||
      response.data?.districts ||
      [];
  } catch (requestError) {
    console.error("Unable to load districts:", requestError);
  } finally {
    locationLoading.value = false;
  }
}

function validateForm() {
  const hasAnyFilter =
    name.value.trim() ||
    selectedState.value ||
    selectedDistrict.value ||
    pincode.value.trim() ||
    mobile.value.trim();

  if (!hasAnyFilter) {
    error.value =
      "Enter at least one search value: name, state, district, pincode or mobile number.";

    return false;
  }

  if (
    pincode.value.trim() &&
    !/^\d{6}$/.test(pincode.value.trim())
  ) {
    error.value = "Pincode must contain exactly 6 digits.";

    return false;
  }

  if (
    mobile.value.trim() &&
    !/^\d{10}$/.test(mobile.value.trim())
  ) {
    error.value = "Mobile number must contain exactly 10 digits.";

    return false;
  }

  return true;
}

async function searchPractitioners(requestedPage = 1) {
  error.value = "";
  searched.value = true;

  if (!validateForm()) {
    results.value = [];
    return;
  }

  loading.value = true;
  page.value = requestedPage;

  try {
    const response = await api.get("/api/gstp/search", {
      params: {
        name: name.value.trim() || undefined,
        state: selectedState.value || undefined,
        district: selectedDistrict.value || undefined,
        pincode: pincode.value.trim() || undefined,
        mobile: mobile.value.trim() || undefined,
        page: page.value,
        limit: limit.value
      }
    });

    results.value =
      response.data?.data ||
      response.data?.records ||
      response.data ||
      [];

    totalRecords.value =
      response.data?.pagination?.totalRecords ||
      results.value.length;

    totalPages.value =
      response.data?.pagination?.totalPages ||
      1;
  } catch (requestError) {
    results.value = [];

    error.value =
      requestError.response?.data?.message ||
      "Unable to fetch GST Practitioner records.";
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  name.value = "";
  selectedState.value = "";
  selectedDistrict.value = "";
  pincode.value = "";
  mobile.value = "";

  districts.value = [];
  results.value = [];

  error.value = "";
  searched.value = false;

  page.value = 1;
  totalRecords.value = 0;
  totalPages.value = 1;
}

function escapeCsv(value) {
  const text = String(value ?? "");

  return `"${text.replaceAll('"', '""')}"`;
}

function exportCsv() {
  if (!hasResults.value) {
    return;
  }

  const headers = [
    "Name",
    "Category",
    "Enrollment Number",
    "Address",
    "Email Address",
    "Mobile Number",
    "Pincode"
  ];

  const rows = results.value.map((record) => [
    getValue(record, ["name", "trpNam"]),
    getValue(record, ["category", "qualification", "ctg"]),
    getValue(record, [
      "enrollment_no",
      "enrollmentNo",
      "enrlNo",
      "gstpId"
    ]),
    getAddress(record),
    getValue(record, ["email_id", "emailId", "email"]),
    getValue(record, [
      "mobile_no",
      "mobileNo",
      "mbNo",
      "cntctNo"
    ]),
    getPincode(record)
  ]);

  const csvContent = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) =>
      row.map(escapeCsv).join(",")
    )
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "gst-practitioners.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

watch(selectedState, loadDistricts);

onMounted(loadStates);
</script>

<template>
  <section class="search-page">
    <div class="page-header">
      <div>
        <h1>Locate GST Practitioners</h1>

        <p>
          Search using state, district, pincode, practitioner
          name or mobile number.
        </p>
      </div>

      <button
        class="export-button"
        :disabled="!hasResults"
        @click="exportCsv"
      >
        Export CSV
      </button>
    </div>

    <form
      class="search-card"
      @submit.prevent="searchPractitioners(1)"
    >
      <div class="form-grid">
        <div class="form-group">
          <label for="name">Name</label>

          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="Enter name of GSTP"
          />
        </div>

        <div class="form-group">
          <label for="state">State</label>

          <select
            id="state"
            v-model="selectedState"
          >
            <option value="">
              Select State
            </option>

            <option
              v-for="state in states"
              :key="state.state_name || state"
              :value="state.state_name || state"
            >
              {{ state.state_name || state }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="district">District</label>

          <select
            id="district"
            v-model="selectedDistrict"
            :disabled="!selectedState || locationLoading"
          >
            <option value="">
              Select District
            </option>

            <option
              v-for="district in districts"
              :key="district.district_name || district"
              :value="district.district_name || district"
            >
              {{ district.district_name || district }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="pincode">Pincode</label>

          <input
            id="pincode"
            v-model="pincode"
            type="text"
            maxlength="6"
            inputmode="numeric"
            placeholder="Enter 6-digit pincode"
          />
        </div>

        <div class="form-group">
          <label for="mobile">Mobile Number</label>

          <input
            id="mobile"
            v-model="mobile"
            type="text"
            maxlength="10"
            inputmode="numeric"
            placeholder="Enter mobile number"
          />
        </div>
      </div>

      <div class="form-actions">
        <button
          class="reset-button"
          type="button"
          @click="resetSearch"
        >
          Reset
        </button>

        <button
          class="search-button"
          type="submit"
          :disabled="loading"
        >
          {{ loading ? "Searching..." : "Search" }}
        </button>
      </div>
    </form>

    <p
      v-if="error"
      class="error-message"
    >
      {{ error }}
    </p>

    <p
      v-if="searched && !loading && !error && !hasResults"
      class="empty-message"
    >
      No GST Practitioner records found.
    </p>

    <div
      v-if="hasResults"
      class="table-wrapper"
    >
      <div class="result-summary">
        {{ totalRecords }} record(s) found
      </div>

      <table>
        <thead>
          <tr>
            <th>Name of GSTP</th>
            <th>Category</th>
            <th>Enrollment Number / GSTP ID</th>
            <th>Address</th>
            <th>Email Address</th>
            <th>Mobile Number</th>
            <th>Pincode</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="record in results"
            :key="
              getValue(record, [
                'enrollment_no',
                'enrollmentNo',
                'enrlNo',
                'gstpId'
              ])
            "
          >
            <td>
              {{ getValue(record, ["name", "trpNam"]) }}
            </td>

            <td>
              {{
                getValue(record, [
                  "category",
                  "qualification",
                  "ctg"
                ])
              }}
            </td>

            <td>
              {{
                getValue(record, [
                  "enrollment_no",
                  "enrollmentNo",
                  "enrlNo",
                  "gstpId"
                ])
              }}
            </td>

            <td>
              {{ getAddress(record) }}
            </td>

            <td>
              {{
                getValue(record, [
                  "email_id",
                  "emailId",
                  "email"
                ])
              }}
            </td>

            <td>
              {{
                getValue(record, [
                  "mobile_no",
                  "mobileNo",
                  "mbNo",
                  "cntctNo"
                ])
              }}
            </td>

            <td>
              {{ getPincode(record) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="hasResults && totalPages > 1"
      class="pagination"
    >
      <button
        :disabled="page <= 1"
        @click="searchPractitioners(page - 1)"
      >
        Previous
      </button>

      <span>
        Page {{ page }} of {{ totalPages }}
      </span>

      <button
        :disabled="page >= totalPages"
        @click="searchPractitioners(page + 1)"
      >
        Next
      </button>
    </div>
  </section>
</template>

<style scoped>
.search-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 42px 28px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 26px;
}

.page-header h1 {
  margin: 0;
  font-size: 38px;
}

.page-header p {
  margin-top: 10px;
  color: #4b5563;
  font-size: 18px;
}

.export-button,
.search-button,
.reset-button,
.pagination button {
  border: none;
  border-radius: 5px;
  padding: 12px 20px;
  cursor: pointer;
  font-size: 16px;
}

.export-button {
  background: #198754;
  color: #ffffff;
}

.export-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.search-card {
  border: 1px solid #d1d5db;
  border-radius: 7px;
  padding: 22px;
  background: #ffffff;
  box-shadow: 0 2px 7px rgb(0 0 0 / 8%);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-group label {
  font-weight: 600;
}

.form-group input,
.form-group select {
  min-height: 44px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 9px 12px;
  font-size: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.search-button {
  min-width: 140px;
  background: #31558e;
  color: #ffffff;
}

.reset-button {
  background: #6b7280;
  color: #ffffff;
}

.error-message {
  margin-top: 16px;
  color: #b91c1c;
  font-weight: 600;
}

.empty-message {
  margin-top: 20px;
  color: #4b5563;
}

.table-wrapper {
  margin-top: 28px;
  overflow-x: auto;
}

.result-summary {
  margin-bottom: 10px;
  font-weight: 600;
}

table {
  width: 100%;
  min-width: 1100px;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #d1d5db;
  padding: 13px 11px;
  text-align: left;
  vertical-align: top;
}

th {
  background: #22272b;
  color: #ffffff;
}

tbody tr:nth-child(odd) {
  background: #f3f4f6;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 22px;
}

.pagination button {
  background: #31558e;
  color: #ffffff;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (max-width: 1000px) {
  .form-grid {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }
}

@media (max-width: 600px) {
  .search-page {
    padding: 24px 14px;
  }

  .page-header {
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>