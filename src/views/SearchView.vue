<script setup>
import { computed, ref } from "vue";
import { searchGSTPractitioners } from "../services/api";

const pincode = ref("");
const records = ref([]);

const isLoading = ref(false);
const errorMessage = ref("");
const hasSearched = ref(false);

const hasRecords = computed(() => records.value.length > 0);

/*
  GST Portal responses may use different nesting formats.
  This function finds the practitioner array safely.
*/
function normalizeRecords(response) {
  console.log("Full backend response:", response);

  const possibleRecords =
    response?.data?.data ||
    response?.data?.records ||
    response?.data?.result ||
    response?.data?.gstpList ||
    response?.data?.lst ||
    response?.records ||
    response?.result ||
    response?.gstpList ||
    response?.lst ||
    response;

  console.log("GST Practitioner records:", possibleRecords);

  return Array.isArray(possibleRecords) ? possibleRecords : [];
}

function getEnrollmentNumber(record) {
  return (
    record.enrollment_no ||
    record.enrollmentNo ||
    record.enrlNo ||
    record.enrNo ||
    record.gstpEnrlNo ||
    record.enrlmntNo ||
    "-"
  );
}

function getName(record) {
  return (
    record.name ||
    record.trpNam ||
    record.gstpName ||
    record.taxpayerName ||
    record.nm ||
    "-"
  );
}

function getPincode(record) {
  return (
    record.pincode ||
    record.pinCode ||
    record.pinCd ||
    record.pnCd ||
    record.adrs?.pinCode ||
    record.adrs?.pnCd ||
    record.address?.pinCode ||
    "-"
  );
}

function getMobile(record) {
  return (
    record.mobile_no ||
    record.mobileNo ||
    record.mbNo ||
    record.cntctNo ||
    record.mobile ||
    record.mobNo ||
    "-"
  );
}

function getEmail(record) {
  return (
    record.email_id ||
    record.emailId ||
    record.email ||
    record.eml ||
    "-"
  );
}

function getState(record) {
  return (
    record.state ||
    record.state_name ||
    record.stateName ||
    record.state_code ||
    record.stateCode ||
    record.stCd ||
    record.st ||
    record.adrs?.state ||
    record.adrs?.stCd ||
    "-"
  );
}

function getDistrict(record) {
  return (
    record.district ||
    record.district_name ||
    record.districtName ||
    record.district_code ||
    record.districtCode ||
    record.dstCd ||
    record.dist ||
    record.adrs?.district ||
    record.adrs?.dstCd ||
    "-"
  );
}

function getStatus(record) {
  return (
    record.status ||
    record.sts ||
    record.registrationStatus ||
    record.statusCd ||
    "-"
  );
}

function getAddress(record) {
  if (typeof record.address === "string") {
    return record.address;
  }

  if (typeof record.adr === "string") {
    return record.adr;
  }

  if (typeof record.adrs === "string") {
    return record.adrs;
  }

  const addressObject = record.adrs || record.address;

  if (addressObject && typeof addressObject === "object") {
    return [
      addressObject.flNo,
      addressObject.floorNo,
      addressObject.bno,
      addressObject.buildingNo,
      addressObject.bnm,
      addressObject.buildingName,
      addressObject.st,
      addressObject.street,
      addressObject.loc,
      addressObject.locality,
      addressObject.city,
      addressObject.dst,
      addressObject.district,
      addressObject.pinCode,
      addressObject.pnCd,
    ]
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

    const response = await searchGSTPractitioners(cleanPincode);

    records.value = normalizeRecords(response);

    console.log("Final table records:", records.value);
  } catch (error) {
    errorMessage.value =
      error.message || "Unable to complete the request.";
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
    "Mobile",
    "Email",
    "State",
    "District",
    "Address",
    "Status",
  ];

  const rows = records.value.map((record) => [
    getEnrollmentNumber(record),
    getName(record),
    getPincode(record),
    getMobile(record),
    getEmail(record),
    getState(record),
    getDistrict(record),
    getAddress(record),
    getStatus(record),
  ]);

  const csvContent = [headings, ...rows]
    .map((row) =>
      row
        .map((value) => {
          const safeValue = String(value ?? "").replace(/"/g, '""');
          return `"${safeValue}"`;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csvContent], {
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
  <section class="container-fluid px-4 py-5">
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

    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <form class="row g-3" @submit.prevent="submitSearch">
          <div class="col-md-8">
            <label class="form-label">Pincode</label>

            <input
              v-model="pincode"
              class="form-control"
              type="text"
              maxlength="6"
              placeholder="Example: 600001"
            />
          </div>

          <div class="col-md-4 d-flex align-items-end">
            <button
              class="btn btn-primary w-100"
              type="submit"
              :disabled="isLoading"
            >
              {{ isLoading ? "Searching..." : "Search" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="text-center py-4">
      <div class="spinner-border" role="status"></div>

      <p class="mt-2">
        Loading GST Practitioner records...
      </p>
    </div>

    <div v-else-if="hasRecords" class="table-responsive">
      <table class="table table-bordered table-striped align-middle">
        <thead class="table-dark">
          <tr>
            <th>Enrollment Number</th>
            <th>Name</th>
            <th>Pincode</th>
            <th>Mobile</th>
            <th>Email</th>
            <th>State</th>
            <th>District</th>
            <th>Address</th>
            <th>Status</th>
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
            <td>{{ getState(record) }}</td>
            <td>{{ getDistrict(record) }}</td>
            <td>{{ getAddress(record) }}</td>
            <td>{{ getStatus(record) }}</td>
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