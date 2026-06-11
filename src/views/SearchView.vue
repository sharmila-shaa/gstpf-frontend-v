<script setup>
import { computed,onMounted, ref,watch } from "vue";
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
const indiaStates = computed(() => {
  const india = countries.value.find(
    (country) => country.name === "India"
  );

  return india?.states || [];
});

onMounted(async () => {
  const response = await getCountriesStates();
  countries.value = response.data || [];
});
watch(state, async (newState) => {
  district.value = "";
  districts.value = [];

  if (!newState) return;

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
  if (typeof record.address === "string") {
    return record.address;
  }

  if (typeof record.adr === "string") {
    return record.adr;
  }

  if (record.adrs && typeof record.adrs === "object") {
    return Object.values(record.adrs)
      .filter(Boolean)
      .join(", ");
  }

  return "-";
}

async function submitSearch() {
  errorMessage.value = "";
  records.value = [];
  hasSearched.value = true;

  const cleanPincode = pincode.value.trim();

  if (!/^\d{6}$/.test(cleanPincode)) {
    errorMessage.value = "Please enter a valid six-digit pincode.";
    return;
  }

  try {
    isLoading.value = true;

    const response = await searchGSTPractitioners({
  name: name.value.trim(),
  state: state.value,
  district: district.value,
  pincode: cleanPincode,
});

    records.value = normalizeRecords(response);
  } catch (error) {
    errorMessage.value = error.message;
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
  ];

  const rows = records.value.map((record) => [
    getEnrollmentNumber(record),
    getName(record),
    getPincode(record),
    getMobile(record),
    getEmail(record),
    getAddress(record),
  ]);

  const csv = [headings, ...rows]
    .map((row) =>
      row
        .map((value) => {
          const safeValue = String(value ?? "").replace(/"/g, '""');
          return `"${safeValue}"`;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `gst-practitioners-${pincode.value}.csv`;
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
          Enter a six-digit Indian pincode to search for practitioners.
        </p>
      </div>

      <button
        v-if="hasRecords"
        class="btn btn-success align-self-start"
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
      <label class="form-label">Name</label>
      <input
        v-model="name"
        class="form-control gst-input"
        type="text"
        placeholder="Enter name of GSTP"
      />
    </div>

    <div class="col-md-3">
      <label class="form-label">
        State <span class="text-danger">*</span>
      </label><select v-model="state" class="form-select gst-input">
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
    <div class="col-md-3">
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

    <div
      v-if="errorMessage"
      class="alert alert-danger"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="isLoading"
      class="text-center py-4"
    >
      <div class="spinner-border" role="status"></div>
      <p class="mt-2">Loading GST Practitioner records...</p>
    </div>

    <div
      v-else-if="hasRecords"
      class="table-responsive"
    >
      <table class="table table-bordered table-striped align-middle">
        <thead class="table-dark">
          <tr>
            <th>Enrollment Number</th>
            <th>Name</th>
            <th>Pincode</th>
            <th>Mobile Number</th>
            <th>Email</th>
            <th>Address</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(record, index) in records"
            :key="record.id || getEnrollmentNumber(record) || index"
          >
            <td>{{ getEnrollmentNumber(record) }}</td>
            <td>{{ getName(record) }}</td>
            <td>{{ getPincode(record) }}</td>
            <td>{{ getMobile(record) }}</td>
            <td>{{ getEmail(record) }}</td>
            <td>{{ getAddress(record) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-else-if="hasSearched && !isLoading && !errorMessage"
      class="alert alert-info"
    >
      No GST Practitioners were found for this pincode.
    </div>
  </section>
</template>