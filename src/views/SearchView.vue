<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { searchGSTPractitioners, getCountriesStates } from "../services/api";

const pincode = ref("");
const countries = ref([]);
const name = ref("");
const state = ref("");
const district = ref("");
const districts = ref([]);
const records = ref([]);

const isLoading = ref(false);
const errorMessage = ref("");
const hasSearched = ref(false);

const hasRecords = computed(() => {
  return records.value.length > 0;
});
const currentPage = ref(1);
const itemsPerPage = ref(10);
const currentPageRecords = computed(() => {
  return paginatedRecords.value.length;
});
const totalPages = computed(() => {
  return Math.ceil(records.value.length / itemsPerPage.value);
});

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;

  return records.value.slice(start, end);
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages = [];

  if (total <= 8) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }

    return pages;
  }

  pages.push(1);

  if (current > 4) {
    pages.push("...");
  }

  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 3) {
    pages.push("...");
  }

  pages.push(total);

  return pages;
});

function goToPage(page) {
  if (page === "...") return;

  currentPage.value = page;
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}
const indiaStates = computed(() => {
  const india = countries.value.find(
    (country) => country.name === "India"
  );

  return india?.states || [];
});

onMounted(async () => {
  try {
    const response = await getCountriesStates();
    countries.value = response.data || [];
  } catch (error) {
    console.error("Unable to load states:", error);
  }
});

watch(state, async (newState) => {
  district.value = "";
  districts.value = [];

  if (!newState) return;

  try {
    const response = await fetch(
      "http://localhost:3000/api/location/districts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          state: newState
        })
      }
    );

    const data = await response.json();

    console.log("Selected State:", newState);
    console.log("District Response:", data);

    districts.value = data.data || [];
  } catch (error) {
    console.error("Unable to load districts:", error);
  }
});

function normalizeRecords(response) {
  const possibleRecords =
    response?.data?.data ||
    response?.data?.records ||
    response?.data ||
    response?.records ||
    response?.result ||
    response;

  return Array.isArray(possibleRecords) ? possibleRecords : [];
}

function getEnrollmentNumber(record) {
  return (
    record.enrollment_no ||
    record.enrollmentNo ||
    record.enrlNo ||
    "-"
  );
}

function getName(record) {
  return record.name || record.trpNam || "-";
}

function getPincode(record) {
  return (
    record.pincode ||
    record.pinCode ||
    record.pinCd ||
    record.pnCd ||
    record.adrs?.pinCode ||
    "-"
  );
}

function getMobile(record) {
  return (
    record.mobile_no ||
    record.mobileNo ||
    record.mbNo ||
    record.cntctNo ||
    "-"
  );
}

function getEmail(record) {
  return record.email_id || record.emailId || "-";
}

function getAddress(record) {
  if (typeof record.address === "string" && record.address.trim()) {
    return record.address;
  }

  if (typeof record.adr === "string" && record.adr.trim()) {
    return record.adr;
  }

  if (record.adrs && typeof record.adrs === "object") {
    return Object.values(record.adrs)
      .filter(Boolean)
      .join(", ");
  }

  return "-";
}

function getStatus(record) {
  return record.status || record.sts || "-";  
}

async function submitSearch() {
  errorMessage.value = "";
  records.value = [];
  hasSearched.value = true;

  const cleanName = name.value.trim();
  const cleanState = state.value.trim();
  const cleanDistrict = district.value.trim();
  const cleanPincode = pincode.value.trim();

  if (!cleanName && !cleanState && !cleanDistrict && !cleanPincode) {
    errorMessage.value = "Please enter at least one search value.";
    return;
  }

  if (cleanPincode && !/^\d{6}$/.test(cleanPincode)) {
    errorMessage.value = "Please enter a valid six-digit pincode.";
    return;
  }

  try {
    isLoading.value = true;

    const response = await searchGSTPractitioners({
      name: cleanName,
      state: cleanState,
      district: cleanDistrict,
      pincode: cleanPincode
    });

    records.value = normalizeRecords(response);
    currentPage.value = 1;
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      error.message ||
      "Unable to search GST Practitioners.";
  } finally {
    isLoading.value = false;
  }
}

function exportCSV() {
  if (!records.value.length) {
    return;
  }

  const headings = [
    "Enrollment Number",
    "Name",
    "Pincode",
    "Mobile Number",
    "Email",
    "Address",
    "Status"
  ];

  const rows = records.value.map((record) => [
    getEnrollmentNumber(record),
    getName(record),
    getPincode(record),
    getMobile(record),
    getEmail(record),
    getAddress(record),
    getStatus(record)
  ]);

  const csv = [headings, ...rows]
    .map((row) =>
      row
        .map((value) => {
          const safeValue = String(value ?? "").replace(/"/g, '""');
          return `"${safeValue}"`;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const fileName =
    pincode.value.trim() ||
    district.value.trim() ||
    state.value.trim() ||
    name.value.trim() ||
    "gst-practitioners";

  link.href = url;
  link.download = `gst-practitioners-${fileName}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}
</script>

<template>
  <section class="container py-5">
    <div class="d-flex flex-wrap justify-content-between gap-3 mb-4">
      <div>
        <h2>Locate GST Practitioners</h2>
        <p class="text-muted mb-0">
          Search GST practitioners by name, state, district, or pincode.
        </p>
      </div>

      <button
        v-if="hasRecords"
        class="btn btn-primary align-self-start"
        type="button"
        @click="exportCSV"
      >
        Export CSV
      </button>
    </div>

    <div class="search-area mb-4">
      <form class="gst-search-form" @submit.prevent="submitSearch">
        <div class="row align-items-end g-4">
          <div class="col-md-3">
            <label class="form-label">Name of GSTP</label>
            <input
              v-model="name"
              class="form-control gst-input"
              type="text"
              placeholder="Enter name of GSTP"
            />
          </div>

          <div class="col-md-3">
            <label class="form-label">State</label>
            <select v-model="state" class="form-select gst-input">
              <option value="">Select</option>

              <option
                v-for="item in indiaStates"
                :key="item.name"
                :value="item.name"
              >
                {{ item.name }}
              </option>
            </select>
          </div>

          <div class="col-md-4">
            <label class="form-label">District</label>

            <select v-model="district" class="form-select gst-input">
              <option value="">Select</option>

              <option
                v-for="item in districts"
                :key="item"
                :value="item"
              >
                {{ item }}
              </option>
            </select>
          </div>

          <div class="col-md-3">
            <label class="form-label">Pincode</label>
            <input
              v-model="pincode"
              class="form-control gst-input"
              type="text"
              maxlength="6"
              placeholder="Enter Pincode"
            />
          </div>
        </div>

        <div class="text-end mt-5">
          <button
            class="btn gst-search-btn"
            type="submit"
            :disabled="isLoading"
          >
            {{ isLoading ? "SEARCHING..." : "SEARCH" }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="text-center py-4">
      <div class="spinner-border" role="status"></div>
      <p class="mt-2">Loading GST Practitioner records...</p>
    </div>

    <div v-else-if="hasRecords">
  <div class="result-count">
    Total Records: {{ records.length }}/Records per page: {{ currentPageRecords }}
  </div>

  <div class="table-responsive">
    <table class="table table-bordered table-striped align-middle">
        <thead class="table-dark">
          <tr>
            <th class="text-center align-middle">Enrollment Number</th>
<th class="text-center align-middle">Name of GSTP</th>
<th class="text-center align-middle">Pincode</th>
<th class="text-center align-middle">Mobile Number</th>
<th class="text-center align-middle">Email</th>
<th class=" align-middle">Address</th>
<th class="text-center align-middle">Status</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(record, index) in paginatedRecords"
            :key="record.id || getEnrollmentNumber(record) || index"
          >
            <td class="text-center align-middle">{{ getEnrollmentNumber(record) }}</td>
            <td class="text-center align-middle">{{ getName(record) }}</td>
            <td class="text-center align-middle">{{ getPincode(record) }}</td>
            <td class="text-center align-middle">{{ getMobile(record) }}</td>
            <td class="text-center align-middle">{{ getEmail(record) }}</td>
            <td class=" align-middle">{{ getAddress(record) }}</td>
            <td class="text-center align-middle">{{ getStatus(record) }}</td>
          </tr>
        </tbody>
      </table>
      </div>
            

      <div v-if="totalPages > 1" class="pagination-wrapper">
        <button
          class="page-btn"
          type="button"
          :disabled="currentPage === 1"
          @click="previousPage"
        >
          «
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          class="page-btn"
          type="button"
          :class="{
            active: currentPage === page,
            dots: page === '...'
          }"
          :disabled="page === '...'"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>

        <button
          class="page-btn"
          type="button"
          :disabled="currentPage === totalPages"
          @click="nextPage"
        >
          »
        </button>
      </div>
    
    </div>

    <div
      v-else-if="hasSearched && !isLoading && !errorMessage"
      class="alert alert-info"
    >
      No GST Practitioners were found for the selected search value.
    </div>
  </section>
</template>